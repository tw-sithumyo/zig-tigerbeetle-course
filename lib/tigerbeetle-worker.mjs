// Runs only in a disposable lab workspace. No student text is passed to a shell.
import { spawn, execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import net from 'node:net';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const [binary, manifestPath] = process.argv.slice(2);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let replica, logs = '', output = '', passed = false;
const objects = text => {
  const values = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
    if (c === '"') quoted = true;
    else if (c === '{') { if (depth++ === 0) start = i; }
    else if (c === '}' && --depth === 0 && start >= 0) { values.push(JSON.parse(text.slice(start, i + 1))); start = -1; }
  }
  return values;
};
const partial = (actual, expected) => Object.entries(expected).every(([key, value]) => String(actual[key]) === String(value));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const socket = net.createServer();
await new Promise((resolve, reject) => { socket.once('error', reject); socket.listen(0, '127.0.0.1', resolve); });
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const addresses = `--addresses=127.0.0.1:${port}`;
const command = async statement => {
  try {
    const result = await exec(binary, ['repl', '--cluster=0', addresses, `--command=${statement}`], { timeout: 8000, maxBuffer: 128 * 1024 });
    return { statement, records: objects(result.stdout), text: result.stdout };
  } catch (error) {
    // The REPL signals a successful empty lookup with exit status 1.
    if (/^lookup_(accounts|transfers) /.test(statement) && !error.stdout?.trim() && /No (accounts|transfers) were found\./.test(error.stderr || '')) {
      return { statement, records: [], text: '(no matching records)\n' };
    }
    throw error;
  }
};
const stop = async () => {
  if (replica && replica.exitCode === null && replica.signalCode === null) {
    await new Promise(resolve => { replica.once('close', resolve); replica.kill('SIGKILL'); });
  }
};
const start = async () => {
  replica = spawn(binary, ['start', addresses, '--development', 'lab.tigerbeetle'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const collect = data => { logs = (logs + data).slice(-6000); };
  replica.stdout.on('data', collect); replica.stderr.on('data', collect);
  replica.on('error', error => { logs += error.message; });
  for (let i = 0; i < 100; i++) {
    if (replica.exitCode !== null || replica.signalCode !== null) throw new Error(`Replica failed to start:\n${logs}`);
    const ready = await new Promise(resolve => {
      const connection = net.createConnection({ host: '127.0.0.1', port });
      connection.setTimeout(100);
      connection.once('connect', () => { connection.destroy(); resolve(true); });
      connection.once('error', () => { connection.destroy(); resolve(false); });
      connection.once('timeout', () => { connection.destroy(); resolve(false); });
    });
    if (ready) return;
    await sleep(100);
  }
  throw new Error(`Replica startup timed out:\n${logs}`);
};
try {
  await exec(binary, ['format', '--cluster=0', '--replica=0', '--replica-count=1', '--development', 'lab.tigerbeetle'], { timeout: 15000 });
  await start();
  for (const statement of manifest.setup || []) {
    const fixture = await command(statement);
    if (fixture.records.some(record => record.status && !record.status.endsWith('.created'))) throw new Error(`Lab fixture failed: ${fixture.text}`);
  }
  const observations = [];
  for (const statement of manifest.commands) {
    const result = await command(statement);
    observations.push(result);
    output += `> ${statement}\n${result.text || '(no records)\n'}\n`;
    if (output.length > 48 * 1024) throw new Error('Lab output exceeded 48 KiB.');
  }
  if (manifest.restart) {
    await stop();
    await start();
    output += '↻ Replica killed and restarted using the SAME data file.\n\n';
  }
  passed = true;
  for (const check of manifest.checks || []) {
    let matches;
    if (check.command) matches = [(await command(check.command))];
    else matches = observations.filter(item => !check.operation || item.statement.startsWith(`${check.operation} `));
    const records = matches.flatMap(item => item.records);
    let ok = (check.count === undefined || records.length === check.count)
      && (check.expect || []).every(expected => records.some(actual => partial(actual, expected)));
    if (check.status) ok = ok && records.filter(record => record.status?.endsWith(`.${check.status}`)).length >= (check.atLeast || 1);
    output += `${ok ? '✓' : '✗'} ${check.name}\n`;
    if (!ok) {
      output += `  Expected: ${JSON.stringify(check.expect || check.status || { count: check.count })}\n  Observed: ${JSON.stringify(records)}\n`;
      passed = false;
    }
  }
} catch (error) { passed = false; output += `\nLab failed: ${error.message}\n${error.stderr || ''}`; }
finally { await stop(); }
process.stdout.write(JSON.stringify({ passed, output, exitCode: passed ? 0 : 1 }));

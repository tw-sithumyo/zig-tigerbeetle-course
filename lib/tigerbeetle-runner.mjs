import { execFileSync, execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, realpathSync } from 'node:fs';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { ROOT, DATA_DIR, TB_BIN, TB_VERSION, TB_COMMIT, TB_SOURCE_DIR } from './config.mjs';
import { environment } from './runner.mjs';
const exec = promisify(execFile);
let active = false;
const failure = (status, message) => Object.assign(new Error(message), { status });
const probe = (binary, args, cwd) => {
  try { return execFileSync(binary, args, { cwd, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
};

export const sourceCatalog = {
  'tiger-style': { file: 'docs/TIGER_STYLE.md', needle: '## Safety', title: 'TigerStyle: safety, bounds, and assertions', lines: 130 },
  account: { file: 'src/tigerbeetle.zig', needle: 'pub const Account =', title: 'Account ABI and invariants', lines: 75 },
  transfer: { file: 'src/tigerbeetle.zig', needle: 'pub const Transfer =', title: 'Transfer layout and packed flags', lines: 85 },
  'state-machine': { file: 'src/state_machine.zig', needle: 'pub fn commit(', title: 'Accounting state-machine commit', lines: 100 },
  replica: { file: 'src/vsr/replica.zig', needle: 'fn on_request(', title: 'Replica: incoming client request', lines: 95 },
  'prepare-ok': { file: 'src/vsr/replica.zig', needle: 'fn on_prepare_ok(', title: 'Replica: prepare acknowledgement', lines: 110 },
  lsm: { file: 'src/lsm/tree.zig', needle: 'pub fn TreeType(', title: 'LSM tree type factory', lines: 100 },
  vopr: { file: 'src/vopr.zig', needle: '', title: 'Deterministic simulator entry point', lines: 110 },
  storage: { file: 'src/testing/storage.zig', needle: '', title: 'Simulated storage', lines: 100 },
  superblock: { file: 'src/vsr/superblock.zig', needle: '', title: 'Superblock and recovery metadata', lines: 100 },
  architecture: { file: 'docs/ARCHITECTURE.md', needle: '## Overview', title: 'Architecture: ordering and persistent state', lines: 90 },
  io: { file: 'src/io.zig', needle: '', title: 'Compile-time platform IO selection', lines: 65 },
  'sum-overflows': { file: 'src/state_machine.zig', needle: 'fn sum_overflows(comptime', title: 'Actual upstream overflow test', lines: 100 },
  build: { file: 'build.zig', needle: 'const zig_version', title: 'Pinned compiler and build steps', lines: 105 },
};

export function tigerEnvironment() {
  const version = probe(TB_BIN, ['version']);
  const commit = existsSync(TB_SOURCE_DIR) ? probe('git', ['rev-parse', 'HEAD'], TB_SOURCE_DIR) : null;
  const zig = path.join(TB_SOURCE_DIR, 'zig', process.platform === 'win32' ? 'zig.exe' : 'zig');
  const sourceZig = existsSync(zig) ? probe(zig, ['version']) : null;
  return { version, expectedVersion: TB_VERSION, ready: Boolean(version?.includes(`version ${TB_VERSION}+`)),
    sourceReady: commit === TB_COMMIT, sourceCommit: commit, expectedCommit: TB_COMMIT, sourceZig,
    sourceBuildReady: commit === TB_COMMIT && sourceZig === '0.14.1', busy: active,
    message: version?.includes(`version ${TB_VERSION}+`) ? 'Real local TigerBeetle labs are ready.' : 'Run npm run setup:tigerbeetle to install the pinned binary, source, and upstream compiler.' };
}

export async function readSource(key) {
  const item = sourceCatalog[key];
  if (!item) throw failure(404, 'Unknown source excerpt.');
  const text = await readFile(path.join(TB_SOURCE_DIR, item.file), 'utf8').catch(() => { throw failure(503, 'Install the pinned source with npm run setup:tigerbeetle.'); });
  const lines = text.split('\n');
  const index = item.needle ? lines.findIndex(line => line.includes(item.needle)) : 0;
  if (index < 0) throw failure(409, 'Source excerpt does not match the expected pinned revision.');
  return { title: item.title, file: item.file, firstLine: index + 1, commit: TB_COMMIT,
    content: lines.slice(index, index + item.lines).join('\n'),
    url: `https://github.com/tigerbeetle/tigerbeetle/blob/${TB_COMMIT}/${item.file}#L${index + 1}` };
}

function parseCommands(code) {
  const clean = code.replace(/\/\/[^\n]*|#[^\n]*/g, '').trim();
  if (!clean.endsWith(';')) throw failure(400, 'End each REPL command with a semicolon.');
  const statements = clean.split(';').map(item => item.trim()).filter(Boolean);
  if (statements.length > 24) throw failure(400, 'This lab accepts at most 24 commands per run.');
  const allowed = new Set(['create_accounts', 'create_transfers', 'lookup_accounts', 'lookup_transfers', 'get_account_transfers', 'get_account_balances', 'query_accounts', 'query_transfers']);
  for (const statement of statements) {
    if (!allowed.has(statement.split(/\s/)[0]) || !/^[a-z_]+\s+[a-zA-Z0-9_\s=,|.\-]+$/.test(statement)) throw failure(400, 'Use supported TigerBeetle REPL data commands with numeric fields and named flags. Shell commands are not accepted.');
  }
  return statements.map(statement => `${statement};`);
}

async function sourceCheck(code, lesson) {
  let answers;
  try { answers = JSON.parse(code); } catch { throw failure(400, 'Submit a valid JSON object in the evidence editor.'); }
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw failure(400, 'Submit a JSON object of source evidence.');
  const status = tigerEnvironment();
  if (!status.sourceReady) throw failure(503, 'The pinned TigerBeetle source is not ready. Run npm run setup:tigerbeetle.');
  let passed = true, output = `Source revision: ${TB_COMMIT}\n\n`;
  for (const [key, [file, needle, symbol]] of Object.entries(lesson.sourceAnswers)) {
    const source = await readFile(path.join(TB_SOURCE_DIR, file), 'utf8');
    const found = source.indexOf(needle);
    const expected = symbol || file;
    const correct = answers[key] === expected && found >= 0;
    passed = passed && correct;
    output += `${correct ? '✓' : '✗'} ${key}: ${JSON.stringify(answers[key] ?? null)}\n`;
    if (correct) output += `  Evidence: ${file}:${source.slice(0, found).split('\n').length} · ${needle || 'file exists'}\n`;
    else output += '  Compare your answer with the local source excerpts.\n';
  }
  return { passed, output, exitCode: passed ? 0 : 1, command: 'inspect pinned TigerBeetle source' };
}

async function upstreamCheck(code) {
  let request;
  try { request = JSON.parse(code); } catch { throw failure(400, 'Submit valid JSON describing the build step and test filter.'); }
  if (!request || request.build_step !== 'test:unit' || request.filter !== 'sum_overflows') {
    return { passed: false, exitCode: 1, command: 'validate upstream test plan', output: 'Choose the narrow unit-test build step and the real overflow test named in the source excerpt. No build was started.\n' };
  }
  if (!tigerEnvironment().sourceBuildReady) throw failure(503, 'The upstream source/compiler is not ready. Run npm run setup:tigerbeetle.');
  const zig = path.join(TB_SOURCE_DIR, 'zig', process.platform === 'win32' ? 'zig.exe' : 'zig');
  let output, ok;
  try {
    const result = await exec(zig, ['build', 'test:unit', '--summary', 'all', '--', 'sum_overflows'], { cwd: TB_SOURCE_DIR, timeout: 180000, maxBuffer: 128 * 1024, env: { ...process.env, NO_COLOR: '1' } });
    output = result.stdout + result.stderr;
    ok = /[1-9]\d*\/[1-9]\d* tests passed|[1-9]\d* passed/.test(output);
    if (!ok) output += '\nNo passing upstream test was reported; completion was not awarded.\n';
  } catch (error) { output = `${error.stdout || ''}${error.stderr || ''}\n${error.message}`; ok = false; }
  return { passed: ok, output: `Using upstream Zig 0.14.1, source ${TB_COMMIT.slice(0, 12)}\n${output}`, exitCode: ok ? 0 : 1, command: './zig/zig build test:unit --summary all -- sum_overflows' };
}

async function liveCheck(code, lesson, action) {
  if (!tigerEnvironment().ready) throw failure(503, 'TigerBeetle is not installed. Run npm run setup:tigerbeetle.');
  const commands = parseCommands(code);
  const root = path.join(DATA_DIR, 'tigerbeetle-work');
  await mkdir(root, { recursive: true });
  const work = await mkdtemp(path.join(root, 'lab-'));
  try {
    await writeFile(path.join(work, 'manifest.json'), JSON.stringify({ commands, setup: lesson.setup, checks: action === 'check' ? lesson.checks : [], restart: action === 'check' && lesson.restart }));
    const worker = path.join(ROOT, 'lib', 'tigerbeetle-worker.mjs');
    const binary = realpathSync(TB_BIN);
    let command = process.execPath;
    let args = [worker, binary, path.join(work, 'manifest.json')];
    if (environment().sandboxed) {
      command = 'bwrap';
      args = ['--unshare-all', '--die-with-parent', '--new-session', '--clearenv'];
      for (const directory of ['/usr', '/lib', '/lib64', '/bin', '/etc/ld.so.cache']) if (existsSync(directory)) args.push('--ro-bind', directory, directory);
      args.push('--ro-bind', path.dirname(binary), '/opt/tb', '--ro-bind', worker, '/worker.mjs', '--bind', work, '/workspace',
        '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--chdir', '/workspace', '--setenv', 'HOME', '/tmp', '--setenv', 'NO_COLOR', '1',
        process.execPath, '/worker.mjs', `/opt/tb/${path.basename(binary)}`, '/workspace/manifest.json');
    }
    const result = await new Promise(resolve => {
      const child = spawn(command, args, { cwd: work, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '', timedOut = false;
      const kill = () => { try { if (process.platform === 'win32') child.kill('SIGKILL'); else process.kill(-child.pid, 'SIGKILL'); } catch {} };
      const timer = setTimeout(() => { timedOut = true; kill(); }, 90000);
      const collect = (data, isError) => {
        if (isError) stderr += data; else stdout += data;
        if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 128 * 1024) kill();
      };
      child.stdout.on('data', data => collect(data, false)); child.stderr.on('data', data => collect(data, true));
      child.on('error', error => { stderr += error.message; });
      child.on('close', () => {
        clearTimeout(timer); kill();
        try { if (timedOut) throw new Error('Lab exceeded 90 seconds.'); resolve(JSON.parse(stdout)); }
        catch (error) { resolve({ passed: false, exitCode: 1, output: `${error.message}\n${stderr}\n${stdout.slice(0, 6000)}` }); }
      });
    });
    return { ...result, command: `tigerbeetle ${TB_VERSION} · fresh local replica + REPL + ${action === 'check' ? 'state assertions' : 'command output'}` };
  } finally { await rm(work, { recursive: true, force: true }); }
}

export async function runTigerExercise({ code, action = 'check', lesson }) {
  if (active) throw failure(409, 'A TigerBeetle lab is already running. Wait for it to finish.');
  if (typeof code !== 'string' || Buffer.byteLength(code) > 64 * 1024) throw failure(400, 'Submit text under 64 KiB.');
  if (!['check', 'run'].includes(action)) throw failure(400, 'Use Run or Check solution for this lab.');
  active = true;
  const start = performance.now();
  try {
    const result = lesson.engine === 'source' ? await sourceCheck(code, lesson) : lesson.engine === 'upstream' ? await upstreamCheck(code) : await liveCheck(code, lesson, action);
    return { ...result, durationMs: Math.round(performance.now() - start) };
  } finally { active = false; }
}

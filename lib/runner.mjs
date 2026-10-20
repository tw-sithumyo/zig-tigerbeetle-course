import { spawn, execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { ZIG_BIN, ZIG_VERSION, DATA_DIR, TOOL_DIR } from './config.mjs';

const OUTPUT_LIMIT = 64 * 1024;
const TIME_LIMIT = 35_000;
let active = false;
let compilerStatus;

function probe(binary, args) {
  try { return execFileSync(binary, args, { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
}

export function environment() {
  if (!compilerStatus) {
    const version = probe(ZIG_BIN, ['version']);
    const sandbox = process.platform === 'linux' && (process.env.ZIG_TIGERBEETLE_COURSE_SANDBOX ?? process.env.ZIG_FORGE_SANDBOX) !== 'off' && probe('bwrap', ['--ro-bind', '/', '/', '--unshare-all', '--die-with-parent', '/usr/bin/true']) !== null;
    compilerStatus = {
      version, expectedVersion: ZIG_VERSION, ready: version === ZIG_VERSION,
      mode: sandbox ? 'Bubblewrap sandbox' : 'Native process', sandboxed: Boolean(sandbox),
      local: true, platform: `${process.platform}/${process.arch}`,
      message: version === ZIG_VERSION ? 'Ready to compile on this computer.' : version ? `This course needs Zig ${ZIG_VERSION}; found ${version}. Run npm run setup or set ZIG_BIN.` : 'Compiler not installed. Run npm run setup, then restart the app.',
    };
  }
  return { ...compilerStatus, busy: active };
}

export function invalidateEnvironment() { compilerStatus = undefined; }

async function execute(args, cwd, input, status) {
  const start = performance.now();
  const zigPath = realpathSync(ZIG_BIN);
  const cache = path.join(DATA_DIR, 'cache');
  await mkdir(cache, { recursive: true });
  let command = zigPath;
  let commandArgs = args;
  let env = { ...process.env, NO_COLOR: '1', ZIG_GLOBAL_CACHE_DIR: cache, ZIG_LOCAL_CACHE_DIR: path.join(cwd, '.zig-cache') };
  if (status.sandboxed) {
    // Bind only the toolchain, system libraries, a temporary workspace, and compiler cache.
    const toolchain = path.dirname(zigPath);
    command = 'bwrap';
    commandArgs = ['--unshare-all', '--die-with-parent', '--new-session', '--clearenv'];
    for (const directory of ['/usr', '/lib', '/lib64', '/bin', '/etc/ld.so.cache']) {
      if (existsSync(directory)) commandArgs.push('--ro-bind', directory, directory);
    }
    commandArgs.push('--ro-bind', toolchain, '/opt/zig', '--bind', cwd, '/workspace', '--bind', cache, '/cache',
      '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--chdir', '/workspace',
      '--setenv', 'HOME', '/tmp', '--setenv', 'PATH', '/usr/bin:/bin', '--setenv', 'NO_COLOR', '1',
      '--setenv', 'ZIG_GLOBAL_CACHE_DIR', '/cache', '--setenv', 'ZIG_LOCAL_CACHE_DIR', '/workspace/.zig-cache',
      `/opt/zig/${path.basename(zigPath)}`, ...args);
  }
  if (process.platform === 'linux' && existsSync('/usr/bin/prlimit')) {
    commandArgs = ['--cpu=30', '--as=4294967296', '--fsize=67108864', '--core=0', '--', command, ...commandArgs];
    command = '/usr/bin/prlimit';
  }
  return new Promise(resolve => {
    const child = spawn(command, commandArgs, { cwd, env, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    let bytes = 0;
    let timedOut = false;
    let truncated = false;
    const stop = () => {
      try {
        if (process.platform === 'win32') child.kill('SIGKILL');
        else process.kill(-child.pid, 'SIGKILL');
      } catch { /* process already exited */ }
    };
    const timer = setTimeout(() => { timedOut = true; stop(); }, TIME_LIMIT);
    const append = data => {
      const remaining = OUTPUT_LIMIT - bytes;
      if (remaining > 0) { output += data.subarray(0, remaining).toString(); bytes += Math.min(remaining, data.length); }
      if (data.length > remaining) { truncated = true; stop(); }
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.stdin.on('error', () => {});
    child.stdin.end(input || '');
    child.on('error', error => { output += `\nUnable to start compiler: ${error.message}`; });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      // Stop descendants that may have inherited the process group.
      stop();
      if (timedOut) output += '\nStopped: execution exceeded 35 seconds.';
      if (truncated) output += '\nStopped: output exceeded 64 KiB.';
      resolve({ exitCode, signal, output, timedOut, truncated, durationMs: Math.round(performance.now() - start), passed: exitCode === 0 && !truncated && !timedOut });
    });
  });
}

export async function runCode({ code, action = 'check', lesson = null }) {
  if (active) throw Object.assign(new Error('The compiler is busy. Wait for the current command to finish.'), { status: 409 });
  if (typeof code !== 'string' || Buffer.byteLength(code) > 64 * 1024) throw Object.assign(new Error('Code must be text under 64 KiB.'), { status: 400 });
  if (!['check', 'run', 'build', 'format', 'test'].includes(action)) throw Object.assign(new Error('Unknown compiler action.'), { status: 400 });
  const status = environment();
  if (!status.ready) throw Object.assign(new Error(status.message), { status: 503 });
  active = true;
  let work;
  try {
    const workRoot = path.join(DATA_DIR, 'work');
    await mkdir(workRoot, { recursive: true });
    work = await mkdtemp(path.join(workRoot, 'job-'));
    await writeFile(path.join(work, 'main.zig'), code);
    if (lesson?.tests) {
      await writeFile(path.join(work, 'checks.zig'), `const std = @import("std");\nconst learner = @import("main.zig");\n\n${lesson.tests}`);
    }
    let args;
    const isProgram = !lesson || lesson.id === 'hello-zig';
    if (action === 'format') args = ['fmt', 'main.zig'];
    else if (action === 'build') args = isProgram ? ['build-exe', 'main.zig'] : ['test', 'checks.zig', '--test-no-exec'];
    else if (action === 'check') args = lesson?.tests ? ['test', 'checks.zig'] : ['run', 'main.zig'];
    else if (action === 'test' || !isProgram) args = ['test', 'main.zig'];
    else args = ['run', 'main.zig'];
    const result = await execute(args, work, null, status);
    result.command = `zig ${args.join(' ')}`;
    // Normalize volatile filesystem locations in diagnostics.
    result.output = result.output.split(work).join('/workspace').split(TOOL_DIR).join('/opt/zig');
    if (action === 'check' && lesson?.id === 'hello-zig' && result.passed) {
      result.passed = result.output === 'Hello, Zig!\n';
      if (!result.passed) result.output += '\nExpected exactly: Hello, Zig! followed by a newline.\n';
    }
    if (action === 'format' && result.passed) result.code = await readFile(path.join(work, 'main.zig'), 'utf8');
    if (action === 'build' && result.passed) result.output += '\nBuild succeeded. A native executable was produced in the temporary workspace.\n';
    if (action === 'run' && lesson?.tests && result.passed) result.output += '\nYour own test blocks ran. Use Check solution to run the course tests.\n';
    if (!result.output) result.output = result.passed ? 'Command completed successfully.\n' : `Command exited with ${result.exitCode ?? result.signal}.\n`;
    return result;
  } finally {
    if (work) await rm(work, { recursive: true, force: true });
    active = false;
  }
}

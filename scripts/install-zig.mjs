import { mkdir, mkdtemp, rm, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, ZIG_VERSION, TOOL_DIR } from '../lib/config.mjs';

const architectures = { x64: 'x86_64', arm64: 'aarch64' };
const systems = { linux: 'linux', darwin: 'macos', win32: 'windows' };
const target = `${architectures[process.arch]}-${systems[process.platform]}`;
const binary = path.join(TOOL_DIR, process.platform === 'win32' ? 'zig.exe' : 'zig');
if (existsSync(binary) && execFileSync(binary, ['version'], { encoding: 'utf8' }).trim() === ZIG_VERSION) {
  console.log(`Zig ${ZIG_VERSION} is already installed at ${TOOL_DIR}`);
  process.exit(0);
}
if (!architectures[process.arch] || !systems[process.platform]) throw new Error(`Unsupported platform: ${target}. Install Zig ${ZIG_VERSION} and set ZIG_BIN.`);
await mkdir(path.join(ROOT, '.tools'), { recursive: true });
const staging = await mkdtemp(path.join(ROOT, '.tools', 'download-'));
try {
  console.log(`Fetching official Zig ${ZIG_VERSION} for ${target}…`);
  const indexResponse = await fetch('https://ziglang.org/download/index.json');
  if (!indexResponse.ok) throw new Error(`Download index returned HTTP ${indexResponse.status}`);
  const release = (await indexResponse.json())[ZIG_VERSION]?.[target];
  if (!release) throw new Error(`No official download for ${target}`);
  const url = new URL(release.tarball);
  if (url.protocol !== 'https:' || url.hostname !== 'ziglang.org') throw new Error('Unexpected download host');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== release.shasum) throw new Error('SHA-256 checksum mismatch');
  const archive = path.join(staging, target.endsWith('windows') ? 'zig.zip' : 'zig.tar.xz');
  await writeFile(archive, bytes);
  if (process.platform === 'win32') {
    // Keep paths out of PowerShell source so spaces and shell metacharacters remain literal.
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      'Expand-Archive -LiteralPath $env:ZIG_TIGERBEETLE_COURSE_ZIP_PATH -DestinationPath $env:ZIG_TIGERBEETLE_COURSE_EXTRACT_DIR'], {
      env: { ...process.env, ZIG_TIGERBEETLE_COURSE_ZIP_PATH: archive, ZIG_TIGERBEETLE_COURSE_EXTRACT_DIR: staging },
      stdio: 'inherit',
    });
  } else {
    execFileSync('tar', ['-xf', archive, '-C', staging]);
  }
  const folder = path.basename(url.pathname).replace(/\.tar\.xz$|\.zip$/, '');
  if (existsSync(TOOL_DIR)) throw new Error(`An incomplete toolchain exists at ${TOOL_DIR}. Remove that folder and retry.`);
  await rename(path.join(staging, folder), TOOL_DIR);
  console.log(`Installed Zig ${ZIG_VERSION}; SHA-256 verified. Run npm start.`);
} finally {
  await rm(staging, { recursive: true, force: true });
}

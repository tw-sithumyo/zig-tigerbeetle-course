import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT, TB_VERSION, TB_COMMIT, TB_TOOL_DIR, TB_SOURCE_DIR } from '../lib/config.mjs';

const assets = {
  'linux-x64': ['tigerbeetle-x86_64-linux.zip', 'af71f2c0057e3b409bf79940fa94894b738187b0d4f1e711097bca15df5d8cd4'],
  'linux-arm64': ['tigerbeetle-aarch64-linux.zip', '413994920fe48b04f5aa86895b7a1d9d98d14803b29d4e91d2a6d0098fff4ef2'],
  'darwin-x64': ['tigerbeetle-universal-macos.zip', '4e085eaffc66c2ed82e7f94a8137c468256d2fb0b35152ccf903cc6676c22940'],
  'darwin-arm64': ['tigerbeetle-universal-macos.zip', '4e085eaffc66c2ed82e7f94a8137c468256d2fb0b35152ccf903cc6676c22940'],
};
const asset = assets[`${process.platform}-${process.arch}`];
if (!asset) throw new Error('Automatic TigerBeetle setup supports Linux/macOS x64 and ARM64. On Windows, run this command inside WSL2 Ubuntu with Linux Node.js. See docs/WINDOWS.md. Setting TIGERBEETLE_BIN alone does not set up the source/compiler labs.');
await mkdir(path.join(ROOT, '.tools'), { recursive: true });
const binary = path.join(TB_TOOL_DIR, 'tigerbeetle');
if (!existsSync(binary)) {
  const staging = await mkdtemp(path.join(ROOT, '.tools', 'tb-download-'));
  try {
    console.log(`Downloading official TigerBeetle ${TB_VERSION}…`);
    const response = await fetch(`https://github.com/tigerbeetle/tigerbeetle/releases/download/${TB_VERSION}/${asset[0]}`);
    if (!response.ok) throw new Error(`Download returned HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== asset[1]) throw new Error('TigerBeetle SHA-256 mismatch');
    const zip = path.join(staging, 'release.zip');
    await writeFile(zip, bytes);
    const executable = execFileSync('unzip', ['-p', zip, 'tigerbeetle'], { maxBuffer: 128 * 1024 * 1024 });
    await mkdir(TB_TOOL_DIR, { recursive: true });
    await writeFile(binary, executable, { mode: 0o755 });
  } finally { await rm(staging, { recursive: true, force: true }); }
}
const version = execFileSync(binary, ['version'], { encoding: 'utf8' }).trim();
if (!version.includes(`version ${TB_VERSION}+`)) throw new Error(`Unexpected binary version: ${version}`);
console.log(version);
if (!existsSync(TB_SOURCE_DIR)) {
  execFileSync('git', ['clone', '--branch', TB_VERSION, 'https://github.com/tigerbeetle/tigerbeetle.git', TB_SOURCE_DIR], { stdio: 'inherit' });
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: TB_SOURCE_DIR, encoding: 'utf8' }).trim();
if (commit !== TB_COMMIT) throw new Error(`Source checkout is at ${commit}; expected ${TB_COMMIT}. Existing source was preserved.`);
if (existsSync(path.join(TB_SOURCE_DIR, '.git', 'shallow'))) {
  execFileSync('git', ['fetch', '--unshallow', '--tags'], { cwd: TB_SOURCE_DIR, stdio: 'inherit' });
}
if (!existsSync(path.join(TB_SOURCE_DIR, 'zig', 'zig'))) {
  execFileSync('sh', ['./zig/download.sh'], { cwd: TB_SOURCE_DIR, stdio: 'inherit' });
}
const sourceZig = execFileSync(path.join(TB_SOURCE_DIR, 'zig', 'zig'), ['version'], { encoding: 'utf8' }).trim();
if (sourceZig !== '0.14.1') throw new Error(`Upstream requires Zig 0.14.1, found ${sourceZig}`);
console.log(`Pinned source ${commit.slice(0, 12)} and upstream Zig ${sourceZig} ready. Local labs work offline.`);

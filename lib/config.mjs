import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const ZIG_VERSION = '0.17.0';
export const DATA_DIR = path.resolve(process.env.ZIG_TIGERBEETLE_COURSE_DATA || process.env.ZIG_FORGE_DATA || path.join(ROOT, '.data'));
export const TOOL_DIR = path.join(ROOT, '.tools', `zig-${ZIG_VERSION}`);
export const ZIG_BIN = process.env.ZIG_BIN || path.join(TOOL_DIR, process.platform === 'win32' ? 'zig.exe' : 'zig');
export const TB_VERSION = '0.17.9';
export const TB_COMMIT = 'cc1c06a924e49b11089c521b2209d34c92caaf18';
export const TB_TOOL_DIR = path.join(ROOT, '.tools', `tigerbeetle-${TB_VERSION}`);
export const TB_SOURCE_DIR = path.join(ROOT, '.tools', `tigerbeetle-source-${TB_VERSION}`);
export const TB_BIN = process.env.TIGERBEETLE_BIN || path.join(TB_TOOL_DIR, process.platform === 'win32' ? 'tigerbeetle.exe' : 'tigerbeetle');

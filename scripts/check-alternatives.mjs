import assert from 'node:assert/strict';
import { lessonById } from '../lib/course.mjs';
import { runCode } from '../lib/runner.mjs';

// Deliberately different implementations protect behavior-based grading.
const alternatives = new Map([
  ['integer-widening', 'pub fn addWide(a: u16, b: u16) u32 { return @as(u32, a) + b; }'],
  ['bounded-conversion', 'pub fn toByte(value: u32) u8 { return @intCast(@min(value, 255)); }'],
  ['maximum-value', 'pub fn highest(values: []const u16) u16 { var largest: u16 = 0; for (values) |value| { largest = @max(largest, value); } return largest; }'],
  ['checked-addition', 'pub fn addChecked(a: u32, b: u32) !u32 { if (b > 4294967295 - a) return error.Overflow; return a + b; }'],
  ['values', 'pub const starting_health: u16 = 100; pub fn heal(health: u16, amount: u16) u16 { const total = @as(u32, health) + amount; return @intCast(@min(total, starting_health)); }'],
  ['generics', 'pub fn larger(comptime T: type, a: T, b: T) T { return @max(a, b); }'],
  ['comptime', 'pub fn filled(comptime n: usize, value: u8) [n]u8 { return @splat(value); }'],
  ['ledger-report', `pub const Report = struct { count: usize = 0, balance: i64 = 0, largest_deposit: ?u32 = null };
    pub fn summarize(entries: []const i32) Report {
      var report = Report{};
      for (entries) |entry| {
        report.count += 1;
        report.balance += entry;
        if (entry > 0) {
          const deposit: u32 = @intCast(entry);
          report.largest_deposit = @max(report.largest_deposit orelse 0, deposit);
        }
      }
      return report;
    }`],
]);
for (const [id, code] of alternatives) {
  const result = await runCode({ code, lesson: lessonById.get(id) });
  assert.equal(result.passed, true, `${id}: equivalent implementation rejected\n${result.output}`);
  console.log(`✓ ${id}: alternative implementation accepted`);
}
console.log(`All ${alternatives.size} alternative implementations accepted by the normal course checks.`);

import { TB_COMMIT, ZIG_VERSION } from './config.mjs';
import { zigReference } from './zig-theory-course.mjs';

const upstream = (file, title) => ({ title, url: `https://github.com/tigerbeetle/tigerbeetle/blob/${TB_COMMIT}/docs/${file}` });
const model = `This is an application-side teaching model compiled with Zig ${ZIG_VERSION}. It does not reproduce TigerBeetle's server validation or SDK.`;
const exercise = (id, title, description, body, task, starter, solution, tests, hints, references) => ({
  id, title, description, body, task, starter, solution, tests, hints, references,
  reference: references.find(ref => ref.url.startsWith('https://ziglang.org/documentation/'))?.url.split('#')[1],
  kind: 'exercise', engine: 'zig', minutes: 20,
});

// Insert before checkpoints without changing IDs used by existing saved progress.
export const boundaryPracticeBefore = {
  'zig-quiz-tigerbeetle-features': [
    exercise('zig-decode-header', 'Decode bytes without casting pointers',
      'Make byte order and truncated input explicit.',
      `## A small wire format
This exercise's invented header is exactly four bytes: version, flags, then a two-byte unsigned length in little-endian order. Version must be 1; flags may be 0 or 1. The low length byte comes first. For example, bytes 0x34 and 0x12 represent 0x1234.

## Decode values, not addresses
Check the slice length before indexing. Widen each byte to u16 before shifting the high byte by 8, then combine with bitwise OR (|). This avoids relying on host byte order, pointer alignment, or a struct's memory layout. A packed struct describes bits; it is not by itself a portable parser for external bytes.

## Review the boundary
Prerequisites: slices, widening, error unions, and packed flags. Return a value with no borrowed storage. This header belongs only to this exercise; it is not a TigerBeetle packet.`,
      'Implement decode(bytes) !Header. Require exactly four bytes (error.InvalidLength), then version 1 (error.UnsupportedVersion), then flags <= 1 (error.InvalidFlags), in that order. Decode the little-endian length. Allow all u16 lengths, including zero. Do not allocate.',
      `pub const Header = struct { flags: u8, length: u16 };
pub fn decode(bytes: []const u8) !Header {
    _ = bytes;
    return .{ .flags = 0, .length = 0 };
}
`,
      `pub const Header = struct { flags: u8, length: u16 };
pub fn decode(bytes: []const u8) !Header {
    if (bytes.len != 4) return error.InvalidLength;
    if (bytes[0] != 1) return error.UnsupportedVersion;
    if (bytes[1] > 1) return error.InvalidFlags;
    return .{
        .flags = bytes[1],
        .length = @as(u16, bytes[2]) | (@as(u16, bytes[3]) << 8),
    };
}
`,
      `test "wire order and full range" {
    const h = try learner.decode(&.{ 1, 1, 0x34, 0x12 });
    try std.testing.expectEqual(@as(u8, 1), h.flags);
    try std.testing.expectEqual(@as(u16, 0x1234), h.length);
    try std.testing.expectEqual(@as(u16, 65535), (try learner.decode(&.{ 1, 0, 255, 255 })).length);
    try std.testing.expectEqual(@as(u16, 0), (try learner.decode(&.{ 1, 0, 0, 0 })).length);
    try std.testing.expectEqual(@as(u8, 0), (try learner.decode(&.{ 1, 0, 1, 0 })).flags);
    for (0..256) |high| {
        const bytes = [_]u8{ 1, 0, 7, @intCast(high) };
        try std.testing.expectEqual(@as(u16, @intCast(high * 256 + 7)), (try learner.decode(&bytes)).length);
    }
}
test "validate before reading" {
    const bytes = [_]u8{ 0, 255, 1, 2, 3 };
    for (0..4) |n| try std.testing.expectError(error.InvalidLength, learner.decode(bytes[0..n]));
    try std.testing.expectError(error.InvalidLength, learner.decode(&bytes));
    try std.testing.expectError(error.UnsupportedVersion, learner.decode(bytes[0..4]));
    try std.testing.expectError(error.InvalidFlags, learner.decode(&.{ 1, 2, 0, 0 }));
    try std.testing.expectError(error.InvalidFlags, learner.decode(&.{ 1, 128, 0, 0 }));
}
`,
      ['Reject length, version, and flags before decoding.', 'Widen the high byte before << 8. Combine the shifted value with the low byte using |.'],
      [zigReference('Operators'), zigReference('Slices'), zigReference('packed-struct')]),
  ],
  'tb-quiz-modeling': [
    exercise('tb-decimal-amount', 'Zig model: parse an exact scaled amount',
      'Turn decimal text into integer units without rounding.',
      `${model}

## Scale is a domain decision
TigerBeetle stores integer amounts. The application chooses their unit. Here we deliberately choose scale 2: "12.30" becomes 1230. This is an exercise policy, not a required scale for every asset. Keep amounts as text until parsed; a floating-point intermediate can lose precision.

## Validate, accumulate, pad
First validate ASCII digits and at most one decimal point. Require digits on both sides of a point. Count fractional digits and reject more than two. Then accumulate digits in u128: checked multiply by 10, checked add the digit. Finally multiply by 10 for each missing fractional place.

Prerequisites: the strict ledger parser and checked arithmetic. @mulWithOverflow returns the same result/flag tuple shape as @addWithOverflow. Check each flag. Validation comes first so malformed syntax consistently reports InvalidAmount.`,
      'Implement parseAmount(text) !u128. Accept unsigned ASCII digits with an optional dot followed by 1–2 digits; leading zeros are allowed. No whitespace, signs, exponents, or separators. Return error.InvalidAmount for invalid syntax, otherwise error.Overflow if scaled units exceed u128. Zero is valid for this parser; transfer validation is separate.',
      `pub fn parseAmount(text: []const u8) !u128 {
    _ = text;
    return 0;
}
`,
      `pub fn parseAmount(text: []const u8) !u128 {
    if (text.len == 0) return error.InvalidAmount;
    var dot = false;
    var fraction: usize = 0;
    for (text, 0..) |byte, i| {
        if (byte == '.') {
            if (dot or i == 0 or i + 1 == text.len) return error.InvalidAmount;
            dot = true;
        } else {
            if (byte < '0' or byte > '9') return error.InvalidAmount;
            if (dot) {
                fraction += 1;
                if (fraction > 2) return error.InvalidAmount;
            }
        }
    }
    var amount: u128 = 0;
    for (text) |byte| {
        if (byte == '.') continue;
        const product = @mulWithOverflow(amount, @as(u128, 10));
        if (product[1] != 0) return error.Overflow;
        const sum = @addWithOverflow(product[0], @as(u128, byte - '0'));
        if (sum[1] != 0) return error.Overflow;
        amount = sum[0];
    }
    while (fraction < 2) : (fraction += 1) {
        const product = @mulWithOverflow(amount, @as(u128, 10));
        if (product[1] != 0) return error.Overflow;
        amount = product[0];
    }
    return amount;
}
`,
      `test "exact integer units" {
    try std.testing.expectEqual(@as(u128, 0), try learner.parseAmount("0"));
    try std.testing.expectEqual(@as(u128, 0), try learner.parseAmount("00.00"));
    try std.testing.expectEqual(@as(u128, 1230), try learner.parseAmount("12.3"));
    try std.testing.expectEqual(@as(u128, 1230), try learner.parseAmount("0012.30"));
    try std.testing.expectEqual(@as(u128, 1200), try learner.parseAmount("12"));
    try std.testing.expectEqual(@as(u128, 1), try learner.parseAmount("0.01"));
    try std.testing.expectEqual(@as(u128, 900719925474099301), try learner.parseAmount("9007199254740993.01"));
    try std.testing.expectEqual(std.math.maxInt(u128), try learner.parseAmount("3402823669209384634633746074317682114.55"));
}
test "syntax before arithmetic and no rounding" {
    for ([_][]const u8{ "", ".5", "1.", "-1", "+1", " 1", "1 ", "1_0", "1e2", "1.001", "1.2.3", "cat", "１２", "999999999999999999999999999999999999999999x" }) |text| {
        try std.testing.expectError(error.InvalidAmount, learner.parseAmount(text));
    }
    for ([_][]const u8{ "3402823669209384634633746074317682114.56", "3402823669209384634633746074317682115", "34028236692093846346337460743176821145", "340282366920938463463374607431768211456.00" }) |text| {
        try std.testing.expectError(error.Overflow, learner.parseAmount(text));
    }
}
`,
      ['Use one pass to validate syntax and count fractional places, then another to accumulate digits.', 'Check multiplication and addition separately. Pad one missing fractional place with one checked multiplication by 10.'],
      [upstream('coding/data-modeling.md#fractional-amounts-and-asset-scale', 'Integer units and asset scale'), zigReference('mulWithOverflow'), zigReference('addWithOverflow')]),
  ],
  'tb-quiz-reliability': [
    exercise('tb-retry-intent', 'Zig model: compare the durable intent',
      'An ID match alone cannot establish that a stored payment matches your request.',
      `${model}

## Keep identity and meaning together
Persist an intent before submitting it and reuse its ID across retries. An ambiguous response is a reason to investigate or retry that intent. Creating a new ID can create another effect.

## Three lookup outcomes
Our restricted immediate-transfer model uses only id, debit, credit, amount, ledger, and code. A missing lookup record returns .retry_same_intent; equal fields return .confirmed; any mismatch returns .conflict. Retry is an instruction to keep the original identity and payload, not proof that the previous request failed.

This model intentionally omits flags, pending operations, metadata, and timestamps. A real integration must handle every applicable field and database result under its pinned API contract. It must also persist workflow state and authorize requests. Comparing structs here establishes none of those properties.

Prerequisites: enums, structs, optional payload capture, and boolean and. Use if (found) |record| to inspect a present record.`,
      'Implement resolve(expected, found) Decision. Return retry_same_intent for null; confirmed only when all six fields match; conflict otherwise. Inputs are already validated immediate-transfer intents. Do not generate an ID or alter either input.',
      `pub const Intent = struct { id: u128, debit: u128, credit: u128, amount: u128, ledger: u32, code: u16 };
pub const Decision = enum { retry_same_intent, confirmed, conflict };
pub fn resolve(expected: Intent, found: ?Intent) Decision {
    _ = expected;
    _ = found;
    return .confirmed;
}
`,
      `pub const Intent = struct { id: u128, debit: u128, credit: u128, amount: u128, ledger: u32, code: u16 };
pub const Decision = enum { retry_same_intent, confirmed, conflict };
pub fn resolve(expected: Intent, found: ?Intent) Decision {
    const record = found orelse return .retry_same_intent;
    if (expected.id == record.id and expected.debit == record.debit and
        expected.credit == record.credit and expected.amount == record.amount and
        expected.ledger == record.ledger and expected.code == record.code) return .confirmed;
    return .conflict;
}
`,
      `test "missing, exact match, and every conflicting field" {
    const expected = learner.Intent{ .id = 1001, .debit = 101, .credit = 102, .amount = 25, .ledger = 700, .code = 10 };
    try std.testing.expectEqual(learner.Decision.retry_same_intent, learner.resolve(expected, null));
    try std.testing.expectEqual(learner.Decision.confirmed, learner.resolve(expected, expected));
    inline for (.{ "id", "debit", "credit", "amount", "ledger", "code" }) |field| {
        var changed = expected;
        @field(changed, field) += 1;
        try std.testing.expectEqual(learner.Decision.conflict, learner.resolve(expected, changed));
    }
    var wide = expected;
    wide.amount = @as(u128, 1) << 100;
    try std.testing.expectEqual(learner.Decision.confirmed, learner.resolve(wide, wide));
    try std.testing.expectEqual(learner.Decision.conflict, learner.resolve(expected, wide));
}
`,
      ['Unwrap found with orelse return .retry_same_intent.', 'Compare all six values. Matching amounts with different accounts still means conflict.'],
      [upstream('coding/reliable-transaction-submission.md', 'Durable identity across retries'), zigReference('Optional-Type')]),
  ],
  'tb-quiz-query': [
    exercise('tb-page-cursor', 'Zig model: advance a history cursor',
      'Handle inclusive bounds and the timestamp endpoints without wrapping.',
      `${model}

## Inclusive query bounds
The pinned AccountFilter uses inclusive timestamp bounds below 2^63; zero disables a bound. To exclude the last record of an ascending page, use last + 1 as the next minimum. For descending pages, use last - 1 as the next maximum. Keep all other filter fields and the opposite bound fixed.

## Stop is different from zero
This helper accepts last timestamps from 1 through 2^63 - 1. It returns null at an endpoint. Returning zero at the descending endpoint would disable the bound and could repeat the first page.

Prerequisites: optionals, errors, if expressions, and integer bounds. The caller also stops on an empty page or when the next bound crosses its fixed opposite bound. This helper does not fetch pages or provide a snapshot.`,
      'Implement nextBound(last: u64, reversed: bool) !?u64. Reject zero or last >= 2^63 with error.InvalidTimestamp. Ascending: return last + 1, or null at 2^63 - 1. Reversed: return last - 1, or null at 1. Validate before arithmetic; never return zero as a continuation.',
      `pub fn nextBound(last: u64, reversed: bool) !?u64 {
    _ = reversed;
    return last;
}
`,
      `pub fn nextBound(last: u64, reversed: bool) !?u64 {
    const maximum: u64 = 9223372036854775807;
    if (last == 0 or last > maximum) return error.InvalidTimestamp;
    if (reversed) {
        if (last == 1) return null;
        return last - 1;
    }
    if (last == maximum) return null;
    return last + 1;
}
`,
      `test "inclusive boundaries become exclusive continuation" {
    try std.testing.expectEqual(@as(?u64, 43), try learner.nextBound(42, false));
    try std.testing.expectEqual(@as(?u64, 41), try learner.nextBound(42, true));
    try std.testing.expectEqual(@as(?u64, 2), try learner.nextBound(1, false));
    try std.testing.expectEqual(@as(?u64, 1), try learner.nextBound(2, true));
    try std.testing.expectEqual(@as(?u64, null), try learner.nextBound(1, true));
    const maximum: u64 = 9223372036854775807;
    try std.testing.expectEqual(@as(?u64, maximum), try learner.nextBound(maximum - 1, false));
    try std.testing.expectEqual(@as(?u64, maximum - 1), try learner.nextBound(maximum, true));
    try std.testing.expectEqual(@as(?u64, null), try learner.nextBound(maximum, false));
    for ([_]bool{ false, true }) |reversed| {
        for ([_]u64{ 0, maximum + 1, std.math.maxInt(u64) }) |invalid| {
            try std.testing.expectError(error.InvalidTimestamp, learner.nextBound(invalid, reversed));
        }
    }
}
`,
      ['Validate against the timestamp domain, not only the u64 maximum.', 'Handle terminal values before adding or subtracting; null tells the caller to stop.'],
      [upstream('reference/account-filter.md', 'Inclusive timestamps, disabled bounds, and reversed order'), zigReference('Optional-Type')]),
  ],
};

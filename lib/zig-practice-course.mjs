import { zigReference } from './zig-theory-course.mjs';

const exercise = (id, title, description, body, task, starter, solution, tests, hints, anchors) => ({
  id, title, description, kind: 'exercise', minutes: 10, body, task, starter, solution, tests, hints,
  reference: anchors[0], references: anchors.map(zigReference),
});

// Small prerequisite exercises are inserted before the existing lesson IDs.
export const zigPracticeBefore = {
  values: [
    exercise('integer-widening', 'Make room before adding', 'Practice integer widening before the health-cap exercise.',
      'A const declaration names a value you will not reassign. The annotation after the colon gives its type: const wide: u32 = small; safely widens a u16 into a u32. Arithmetic on two u16 operands can overflow before a wider result receives it, so widen an operand before the operation.\n\nThe supplied pub fn is a public function. Parameters appear inside parentheses; the type after them is its return type. return sends the result to the caller. Keep that skeleton and focus on the calculation. _ = b; marks a parameter as intentionally unused in the unfinished starter; remove that line when you use b.\n\n```zig\npub fn triple(value: u16) u32 {\n    const wide: u32 = value;\n    return wide * 3;\n}\n```\nNames beginning with @ are compiler builtins, not functions you must import. @as(T, value) supplies an explicit destination type using Zig\'s coercion rules. For this widening, @as(u32, value) is equivalent to assigning value to the typed wide constant. It does not mean that any value can be converted to any type.\n\n```zig\nconst wide = @as(u32, small);\n```\nBoth forms are valid here. The tests check the returned value, not which spelling you choose.',
      'Implement addWide(a: u16, b: u16) u32 for every pair of u16 values. A typed u32 temporary or @as is fine. Two maximum inputs must produce 131070.',
      'pub fn addWide(a: u16, b: u16) u32 {\n    _ = b;\n    return a;\n}\n',
      'pub fn addWide(a: u16, b: u16) u32 {\n    const wide_a: u32 = a;\n    return wide_a + b;\n}\n',
      'test "widen before addition" {\n    try std.testing.expectEqual(@as(u32, 0), learner.addWide(0, 0));\n    try std.testing.expectEqual(@as(u32, 42), learner.addWide(20, 22));\n    try std.testing.expectEqual(@as(u32, 65536), learner.addWide(65535, 1));\n    try std.testing.expectEqual(@as(u32, 131070), learner.addWide(65535, 65535));\n}\n',
      ['Create const wide_a: u32 = a before adding.', 'An equivalent expression is @as(u32, a) + b. The return annotation alone does not replace widening the operand.'],
      ['Type-Coercion-Integer-and-Float-Widening', 'as', 'Functions']),
    exercise('bounded-conversion', 'Check the range, then narrow', 'Learn comparisons and @intCast before converting a capped result.',
      'An if statement runs its body when a boolean comparison is true. For example, if (value > 50) return 50; exits early for a value above a limit. Otherwise execution continues below it. The operators <, >, <=, and >= compare values.\n\nNarrowing from u32 to u8 needs a range argument: u8 only holds 0 through 255. @intCast(value) converts an integer to the type supplied by its context. That context can be a typed variable or this function\'s return type. It does not clamp a large number; an out-of-range cast is illegal behavior and is caught in safe modes.\n\n```zig\npub fn capAtFifty(value: u32) u8 {\n    if (value > 50) return 50;\n    return @intCast(value); // u8 from the return type; now at most 50\n}\n```\n@min(a, b) returns the smaller value; @max(a, b) returns the larger. For these nonnegative integer examples, @min(value, 50) expresses the same cap as the branch. This is an optional alternative, not a required optimization:\n\n```zig\nconst capped = @min(value, 50);\nconst small: u8 = @intCast(capped);\n```\nA typed temporary or @as widens representable values; @intCast narrows only when the actual value fits. _ = value; in a starter merely marks an otherwise unused parameter; remove it once the function uses that parameter.',
      'Implement toByte(value: u32) u8. Return value when it is at most 255, otherwise return 255. Use an if comparison or @min, and narrow only after the result is known to fit.',
      'pub fn toByte(value: u32) u8 {\n    _ = value;\n    return 0;\n}\n',
      'pub fn toByte(value: u32) u8 {\n    if (value > 255) return 255;\n    return @intCast(value);\n}\n',
      'test "narrow only a representable value" {\n    try std.testing.expectEqual(@as(u8, 0), learner.toByte(0));\n    try std.testing.expectEqual(@as(u8, 42), learner.toByte(42));\n    try std.testing.expectEqual(@as(u8, 255), learner.toByte(255));\n    try std.testing.expectEqual(@as(u8, 255), learner.toByte(256));\n    try std.testing.expectEqual(@as(u8, 255), learner.toByte(4294967295));\n}\n',
      ['Handle values above 255 before @intCast.', 'The optional compact version is return @intCast(@min(value, 255));. It has the same integer behavior as the branch.'],
      ['if', 'intCast', 'min', 'max']),
  ],
  switch: [
    exercise('maximum-value', 'Find a maximum two ways', 'Connect a familiar comparison to @max without prescribing one style.',
      'To keep the largest unsigned value seen so far, initialize a var to zero and replace it only when a larger value arrives. Zero is a valid empty-input result for this exercise because u16 has no negative values.\n\n```zig\nif (candidate > largest) {\n    largest = candidate;\n}\n```\nFor these integer values, largest = @max(largest, candidate); has the same effect. @max returns a value; it does not update either argument on its own. @min returns the smaller value. An if statement is often clearer when a branch must do more than select a number. Either implementation is accepted here.\n\nWhen two values tie, keeping the old largest preserves the same maximum. The full for loop and its accumulator still need to handle an empty slice.',
      'Implement highest(values: []const u16) u16. Return the largest item, or zero for an empty slice. Use comparisons, @max, or another equivalent implementation.',
      'pub fn highest(values: []const u16) u16 {\n    _ = values;\n    return 0;\n}\n',
      'pub fn highest(values: []const u16) u16 {\n    var largest: u16 = 0;\n    for (values) |value| {\n        if (value > largest) largest = value;\n    }\n    return largest;\n}\n',
      'test "maximum includes empty, ties, and full range" {\n    try std.testing.expectEqual(@as(u16, 0), learner.highest(&.{}));\n    try std.testing.expectEqual(@as(u16, 9), learner.highest(&.{ 2, 9, 3 }));\n    try std.testing.expectEqual(@as(u16, 9), learner.highest(&.{ 9, 9, 2 }));\n    try std.testing.expectEqual(@as(u16, 65535), learner.highest(&.{ 0, 65535 }));\n}\n',
      ['Keep a u16 accumulator outside the loop.', 'Update only for a larger value, or assign @max(largest, value). Return after the loop.'],
      ['for', 'if', 'max']),
  ],
  'quiz-contracts': [
    exercise('checked-addition', 'Report overflow as an error', 'Read both parts of an overflow-reporting result.',
      '@addWithOverflow(a, b) returns a tuple with two fields: result[0] is the wrapped sum and result[1] is a one-bit overflow flag. A nonzero flag means the mathematical sum did not fit. Inspect the flag before accepting the value. Tuple indices start at zero, like array indices.\n\n```zig\nconst result = @addWithOverflow(a, b);\nif (result[1] != 0) return error.Overflow;\nreturn result[0];\n```\nHere != means not equal. Returning error.Overflow makes failure an ordinary error-union outcome instead of allowing an overflowing + to trap. An equivalent approach checks b against maxInt minus a before adding. Do not add first and then try to detect overflow: the ordinary addition itself may already be invalid.\n\nA bound checked with ordinary comparisons is accepted too. The contract is to return the exact representable sum or report overflow, not to spell the code with a particular builtin.',
      'Implement addChecked(a: u32, b: u32) !u32. Return the sum when representable, or error.Overflow otherwise. The maximum u32 is 4294967295.',
      'pub fn addChecked(a: u32, b: u32) !u32 {\n    _ = b;\n    return a;\n}\n',
      'pub fn addChecked(a: u32, b: u32) !u32 {\n    const result = @addWithOverflow(a, b);\n    if (result[1] != 0) return error.Overflow;\n    return result[0];\n}\n',
      'test "checked addition distinguishes exact maximum from overflow" {\n    try std.testing.expectEqual(@as(u32, 0), try learner.addChecked(0, 0));\n    try std.testing.expectEqual(@as(u32, 42), try learner.addChecked(20, 22));\n    try std.testing.expectEqual(@as(u32, 4294967295), try learner.addChecked(4294967294, 1));\n    try std.testing.expectEqual(@as(u32, 4294967295), try learner.addChecked(4294967295, 0));\n    try std.testing.expectError(error.Overflow, learner.addChecked(4294967295, 1));\n    try std.testing.expectError(error.Overflow, learner.addChecked(4294967295, 4294967295));\n}\n',
      ['Check result[1] before returning result[0].', 'With comparisons instead: reject b > 4294967295 - a before evaluating a + b.'],
      ['addWithOverflow', 'Errors']),
  ],
};

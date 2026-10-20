// TigerBeetle-specific Zig language and engineering practice.
export const zigTigerStyleChapters = [
  {
    "id": "zig-tigerstyle-chapter",
    "title": "Write in TigerStyle",
    "description": "Explicit contracts, bounded work, clear names and units.",
    "icon": "09",
    "trackId": "zig",
    "lessons": [
      {
        "id": "zig-tigerstyle",
        "title": "TigerStyle: design for bounded behavior",
        "kind": "reading",
        "minutes": 12,
        "description": "TigerStyle gives you a way to review correctness, not just formatting.",
        "body": "## Names explain the model\nThe pinned TigerBeetle source uses snake_case for functions, variables, and files; type names follow Zig conventions, with deliberate acronym capitalization. Put units and qualifiers at the end of descriptive names: timeout_ms and latency_ms_max. Use an options struct when same-typed positional arguments are easy to swap. Callback names describe the operation they finish and callbacks come last.\n\n## Bounds make work reviewable\nGive queues and batches explicit limits. Use iterative, simple control flow and avoid recursion in paths that must be bounded. TigerStyle prioritizes safety, performance, then developer experience. Bounded work helps all three: a reviewer can reason about memory consumption and worst-case latency.\n\n## Validate, then assert\nMalformed input, insufficient capacity, and IO failure are operating errors to handle. Assertions instead document internal preconditions, postconditions, and invariants that a correct program must satisfy. Keep assertion expressions free of side effects; behavior must not depend on an assertion being evaluated. The document asks for dense, often paired assertions, including compile-time relationships. It is not a request to pad functions with meaningless asserts.\n\n## Memory and arithmetic\nUse explicitly sized integers for domain/protocol values. usize remains appropriate where a Zig indexing API requires it; convert at a deliberate boundary. Check overflow before trusting a computed value. Derive allocation bounds at initialization and reuse storage in the event loop. Avoid hiding allocations inside helpers called for every request.\n\n## A review habit\nFor each exercise, name the external error cases, the internal invariant, the work bound, and why the units/types are correct. zig fmt standardizes formatting; it does not certify TigerStyle or prove correctness. These lessons apply source-inspired patterns on Zig 0.17.0; build actual TigerBeetle with its own pinned compiler.",
        "references": [
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "Zig 0.17.0: safety and illegal behavior",
            "url": "https://ziglang.org/documentation/0.17.0/#Illegal-Behavior"
          }
        ],
        "sourceKeys": [
          "tiger-style"
        ],
        "reference": "Illegal-Behavior"
      },
      {
        "id": "zig-style-contracts",
        "title": "Validate outside, assert inside",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Distinguish expected rejection from a broken internal contract.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nA caller can legitimately request more space than remains. Return a recoverable error for that operating condition before entering the helper. Inside reserve_valid, assertions state the preconditions the validated path already established. Comparing requested with capacity minus used also avoids an overflowing addition during validation. Explain which caller mistake each check detects.\n\n## Syntax before you solve\nstd.debug.assert(condition) checks an internal invariant. The helper supplied in this exercise asserts its preconditions; validation in reserve must handle normal bad requests before calling it. assert does not return an error union and is not a substitute for returning error.Full.",
        "task": "Finish reserve(capacity, used, requested): InvalidState when used > capacity; InvalidAmount for zero requested; Full if requested > capacity - used. Otherwise call the provided reserve_valid helper and return the new used count. Preserve its side-effect-free assertions. Validate before the helper can assert.",
        "starter": "const std = @import(\"std\");\npub fn reserve(capacity: u32, used: u32, requested: u32) !u32 {\n    if (used > capacity) return error.InvalidState;\n    if (requested == 0) return error.InvalidAmount;\n    return reserve_valid(capacity, used, requested);\n}\nfn reserve_valid(capacity: u32, used: u32, requested: u32) u32 {\n    std.debug.assert(used <= capacity);\n    std.debug.assert(requested <= capacity - used);\n    const used_next = used + requested;\n    std.debug.assert(used_next <= capacity);\n    return used_next;\n}\n",
        "solution": "const std = @import(\"std\");\npub fn reserve(capacity: u32, used: u32, requested: u32) !u32 {\n    if (used > capacity) return error.InvalidState;\n    if (requested == 0) return error.InvalidAmount;\n    if (requested > capacity - used) return error.Full;\n    return reserve_valid(capacity, used, requested);\n}\nfn reserve_valid(capacity: u32, used: u32, requested: u32) u32 {\n    std.debug.assert(used <= capacity);\n    std.debug.assert(requested <= capacity - used);\n    const used_next = used + requested;\n    std.debug.assert(used_next <= capacity);\n    return used_next;\n}\n",
        "tests": "test \"external errors stay recoverable\" {\n    try std.testing.expectEqual(@as(u32, 8), try learner.reserve(10, 5, 3));\n    try std.testing.expectEqual(@as(u32, 10), try learner.reserve(10, 5, 5));\n    try std.testing.expectError(error.Full, learner.reserve(10, 5, 6));\n    try std.testing.expectError(error.InvalidState, learner.reserve(5, 6, 1));\n    try std.testing.expectError(error.InvalidAmount, learner.reserve(10, 0, 0));\n    try std.testing.expectEqual(std.math.maxInt(u32), try learner.reserve(std.math.maxInt(u32), std.math.maxInt(u32) - 1, 1));\n}\n",
        "hints": [
          "Check requested against remaining capacity only after used has been validated.",
          "Return error.Full instead of letting the helper assert on a normal full-capacity request."
        ],
        "references": [
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "Zig 0.17.0: Illegal Behavior",
            "url": "https://ziglang.org/documentation/0.17.0/#Illegal-Behavior"
          }
        ],
        "sourceKeys": [
          "tiger-style"
        ],
        "reference": "Illegal-Behavior"
      },
      {
        "id": "zig-style-bounds",
        "title": "Bound the batch, check the sum",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "A workload limit is part of the function’s contract.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nA maximum of 64 entries bounds the loop and makes a worst-case work estimate possible. A u128 sum can still overflow after several valid entries, so widening alone is not a policy. Validate the batch length first, reject forbidden zero values, and use overflow-reporting arithmetic. A business amount should not silently wrap or saturate merely to keep the function running.\n\n## Syntax before you solve\nRecall Checked addition: @addWithOverflow(total, amount) returns a tuple. Field [0] is the wrapped sum; field [1] is an overflow flag. If [1] is nonzero, return error.Overflow instead of accepting [0]. A comparison against the remaining integer range is also valid. The builtins in the read-only tests help construct boundary inputs; you do not need to copy their style.",
        "task": "Implement sum_amounts(amounts: []const u128) !u128. Allow 1 through 64 values. Empty → error.Empty; more than 64 → error.TooMany; a zero value → error.InvalidAmount; arithmetic overflow → error.Overflow. Otherwise return the sum. Check batch length before processing entries.",
        "starter": "pub fn sum_amounts(amounts: []const u128) !u128 {\n    return amounts.len;\n}\n",
        "solution": "pub fn sum_amounts(amounts: []const u128) !u128 {\n    if (amounts.len == 0) return error.Empty;\n    if (amounts.len > 64) return error.TooMany;\n    var total: u128 = 0;\n    for (amounts) |amount| {\n        if (amount == 0) return error.InvalidAmount;\n        const sum = @addWithOverflow(total, amount);\n        if (sum[1] != 0) return error.Overflow;\n        total = sum[0];\n    }\n    return total;\n}\n",
        "tests": "test \"bounded work and negative space\" {\n    try std.testing.expectEqual(@as(u128, 30), try learner.sum_amounts(&.{ 10, 20 }));\n    try std.testing.expectError(error.Empty, learner.sum_amounts(&.{}));\n    try std.testing.expectError(error.InvalidAmount, learner.sum_amounts(&.{ 1, 0 }));\n    try std.testing.expectError(error.Overflow, learner.sum_amounts(&.{ std.math.maxInt(u128), 1 }));\n    const full: [64]u128 = @splat(1);\n    try std.testing.expectEqual(@as(u128, 64), try learner.sum_amounts(&full));\n    const oversized: [65]u128 = @splat(0);\n    try std.testing.expectError(error.TooMany, learner.sum_amounts(&oversized));\n}\n",
        "hints": [
          "A limit check makes the for loop’s worst-case iteration count explicit.",
          "Use @addWithOverflow and inspect its second tuple element before accepting the result."
        ],
        "references": [
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "state_machine.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/state_machine.zig"
          },
          {
            "title": "Zig 0.17.0: addWithOverflow",
            "url": "https://ziglang.org/documentation/0.17.0/#addWithOverflow"
          }
        ],
        "sourceKeys": [
          "sum-overflows"
        ],
        "reference": "addWithOverflow"
      },
      {
        "id": "zig-style-units",
        "title": "Names carry units and intent",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Avoid same-typed positional arguments and silent unit conversion.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nA number without a unit can be validly typed and still be wrong by a factor of a million. The options struct makes now_ns and timeout_ms visible at the call site. Widen before multiplying, then check the final addition. This separates a unit-conversion argument from the independent question of whether a deadline fits in u64.\n\n## Syntax before you solve\n@as(u64, options.timeout_ms) widens before multiplication. @addWithOverflow(now_ns, timeout_ns) returns {wrapped sum, overflow flag}; reject a nonzero flag at index 1 and return the value at index 0 only on success. The explicit unit conversion and checked-addition contract matter, not whether you use this builtin or a correct precondition comparison.",
        "task": "Implement deadline_ns(options: struct { now_ns: u64, timeout_ms: u32 }) !u64. Convert milliseconds to nanoseconds in u64, add to now_ns, and return error.Overflow if the deadline would exceed u64. A zero timeout is valid.",
        "starter": "pub fn deadline_ns(options: struct { now_ns: u64, timeout_ms: u32 }) !u64 {\n    return options.now_ns + options.timeout_ms;\n}\n",
        "solution": "pub fn deadline_ns(options: struct { now_ns: u64, timeout_ms: u32 }) !u64 {\n    const timeout_ns: u64 = @as(u64, options.timeout_ms) * 1_000_000;\n    const deadline = @addWithOverflow(options.now_ns, timeout_ns);\n    if (deadline[1] != 0) return error.Overflow;\n    return deadline[0];\n}\n",
        "tests": "test \"named units and overflow\" {\n    try std.testing.expectEqual(@as(u64, 2_000_007), try learner.deadline_ns(.{ .now_ns = 7, .timeout_ms = 2 }));\n    try std.testing.expectEqual(@as(u64, 7), try learner.deadline_ns(.{ .now_ns = 7, .timeout_ms = 0 }));\n    try std.testing.expectEqual(@as(u64, 4294967295000000), try learner.deadline_ns(.{ .now_ns = 0, .timeout_ms = std.math.maxInt(u32) }));\n    try std.testing.expectError(error.Overflow, learner.deadline_ns(.{ .now_ns = std.math.maxInt(u64), .timeout_ms = 1 }));\n}\n",
        "hints": [
          "Widen timeout_ms before multiplying by 1_000_000.",
          "Use the overflow-aware builtin for the final addition; the options struct makes units explicit at the call site."
        ],
        "references": [
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          },
          {
            "title": "Zig 0.17.0: Integers",
            "url": "https://ziglang.org/documentation/0.17.0/#Integers"
          },
          {
            "title": "Zig 0.17.0: as",
            "url": "https://ziglang.org/documentation/0.17.0/#as"
          },
          {
            "title": "Zig 0.17.0: addWithOverflow",
            "url": "https://ziglang.org/documentation/0.17.0/#addWithOverflow"
          }
        ],
        "sourceKeys": [
          "transfer"
        ],
        "reference": "Integers"
      },
      {
        "id": "zig-quiz-tigerstyle",
        "title": "Checkpoint: TigerStyle",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "TigerBeetle’s function/file naming convention is:",
            "options": [
              "snake_case",
              "camelCase everywhere",
              "One-letter names"
            ],
            "answer": 0,
            "explanation": "TigerStyle uses descriptive snake_case names for functions, variables, and files."
          },
          {
            "prompt": "Which error belongs in recoverable validation?",
            "options": [
              "A normal request exceeds available capacity",
              "An impossible internal state after validation",
              "A broken compile-time layout assertion"
            ],
            "answer": 0,
            "explanation": "Expected external/operating errors must be handled; assertions express programmer contracts."
          },
          {
            "prompt": "Why must assertions have no side effects?",
            "options": [
              "They always allocate",
              "They are network requests",
              "Program behavior must not depend on assertion evaluation"
            ],
            "answer": 2,
            "explanation": "Assertions can be treated differently by optimization modes. Never hide required state changes in them."
          },
          {
            "prompt": "Which name better documents both quantity and unit?",
            "options": [
              "max",
              "latency_ms_max",
              "x"
            ],
            "answer": 1,
            "explanation": "The quantity comes first and its unit/qualifier comes last, helping related names group together."
          }
        ]
      }
    ]
  },
  {
    "id": "zig-tigerbeetle-patterns",
    "title": "Read TigerBeetle’s Zig",
    "description": "Packed data, type factories, and explicit completions.",
    "icon": "10",
    "trackId": "zig",
    "lessons": [
      {
        "id": "zig-tb-features",
        "title": "The Zig features behind the database",
        "kind": "reading",
        "minutes": 12,
        "description": "Recognize the language patterns before reading thousands of lines of implementation.",
        "body": "## Layout and compile-time contracts\nextern struct controls ABI field order and alignment; it can still contain padding, so measure rather than assume. packed struct(u16) makes flag bit positions explicit. @bitCast reinterprets equal-width bits; validate reserved/invalid bit combinations at an input boundary. @sizeOf, @alignOf, @offsetOf and compile-time assertions check binary contracts. The TigerBeetle source path includes a separate exact Account-layout exercise.\n\n## Types built from parameters\nA function taking comptime type/size parameters can return a specialized struct. @This() gives a nested implementation its own concrete type. Embedded arrays provide bounded storage. Read the bounds and object lifetime before assuming a generic abstraction is cheap. The queue below is a small model inspired by bounded data structures, not a replacement for the upstream implementation.\n\n## State and callbacks\nAn IO completion can live as a field of a longer-lived owner. A function pointer handles completion and @fieldParentPtr recovers the owner from its embedded field. This is safe only when the pointer really refers to that field of a live, correctly aligned parent. Do not return completions that borrow a dead stack frame or move a parent while an operation holds a pointer to its field. The exercise is synchronous so you can learn the pointer relationship before asynchronous IO.\n\n## Platform and version\nbuiltin.target.os.tag selects platform-specific IO at compile time. Zig errors and tagged unions express alternative outcomes. TigerBeetle’s source compiler is pinned independently from this course; inspect the version before using compiler syntax, standard-library APIs, or old async examples. These patterns explain actual code structure, but implementing VSR and storage correctly needs the project’s tests and design documents too.\n\n## Interoperability and concurrency boundaries\nAn extern layout helps a Zig type match a C ABI; callers still need matching ownership, alignment, endianness, and valid field values. Do not treat arbitrary bytes as a validated account. Similarly, a callback abstraction does not create thread safety. A state machine needs a defined owner for mutable state and an ordering rule for asynchronous completions. Zig permits low-level threading and atomic operations, but the programmer must prevent data races. Read the database's event-loop and IO contracts before changing when a callback can run.",
        "references": [
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          },
          {
            "title": "io.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/io.zig"
          },
          {
            "title": "replica.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/vsr/replica.zig"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "Zig 0.17.0: extern struct",
            "url": "https://ziglang.org/documentation/0.17.0/#extern-struct"
          },
          {
            "title": "Zig 0.17.0: fieldParentPtr",
            "url": "https://ziglang.org/documentation/0.17.0/#fieldParentPtr"
          },
          {
            "title": "Zig 0.17.0: Atomics",
            "url": "https://ziglang.org/documentation/0.17.0/#Atomics"
          }
        ],
        "sourceKeys": [
          "account",
          "io",
          "prepare-ok"
        ],
        "reference": "extern-struct"
      },
      {
        "id": "zig-packed-flags",
        "title": "Decode flags with an explicit contract",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Validate a packed representation at its boundary.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nA protocol bitfield assigns meaning to positions, not just names. A packed struct provides a representation, while reserved-bit validation defines which representations are accepted. @bitCast reinterprets bits of the same width; it does not check that their meaning is allowed. Keep that distinction when reading account and transfer flags in the real database.\n\n## Syntax before you solve\nHexadecimal numbers begin with 0x. Bitwise & keeps bits that are set in both operands: bits & 0xfff0 isolates reserved positions 4 through 15; bits & 0x000e isolates positions 1 through 3. @popCount(value) counts the set bits, so a count above one in that second mask detects conflicting lifecycle flags. An alternative is to @bitCast into Flags, reject nonzero reserved, and compare the boolean fields in pairs. @bitCast takes its result type from context and only reinterprets equal-width bits.",
        "task": "Finish decode_flags(bits). The first four bits represent linked, pending, post_pending_transfer, and void_pending_transfer. Bits 4..15 are reserved in this reduced model: reject them with error.ReservedBits. At most one of pending/post/void may be set, else error.ConflictingFlags. linked is independent. Keep the packed layout and encode_flags. This is a reduced four-flag model; the real type has more flags.",
        "starter": "pub const Flags = packed struct(u16) {\n    linked: bool = false,\n    pending: bool = false,\n    post_pending_transfer: bool = false,\n    void_pending_transfer: bool = false,\n    reserved: u12 = 0,\n};\npub fn encode_flags(flags: Flags) u16 { return @bitCast(flags); }\npub fn decode_flags(bits: u16) !Flags {\n    return @bitCast(bits);\n}\n",
        "solution": "pub const Flags = packed struct(u16) {\n    linked: bool = false,\n    pending: bool = false,\n    post_pending_transfer: bool = false,\n    void_pending_transfer: bool = false,\n    reserved: u12 = 0,\n};\npub fn encode_flags(flags: Flags) u16 { return @bitCast(flags); }\npub fn decode_flags(bits: u16) !Flags {\n    if (bits & 0xfff0 != 0) return error.ReservedBits;\n    if (@popCount(bits & 0x000e) > 1) return error.ConflictingFlags;\n    return @bitCast(bits);\n}\n",
        "tests": "test \"flag representation and validation\" {\n    try std.testing.expectEqual(@as(usize, 16), @bitSizeOf(learner.Flags));\n    try std.testing.expectEqual(@as(u16, 3), learner.encode_flags(.{ .linked = true, .pending = true }));\n    const flags = try learner.decode_flags(3);\n    try std.testing.expect(flags.linked);\n    try std.testing.expect(flags.pending);\n    try std.testing.expect(!(try learner.decode_flags(0)).pending);\n    try std.testing.expectError(error.ReservedBits, learner.decode_flags(16));\n    try std.testing.expectError(error.ConflictingFlags, learner.decode_flags(6));\n    try std.testing.expectError(error.ConflictingFlags, learner.decode_flags(12));\n}\n",
        "hints": [
          "Mask reserved bits with 0xfff0.",
          "@popCount(bits & 0x000e) counts active lifecycle bits without counting linked."
        ],
        "references": [
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          },
          {
            "title": "Zig 0.17.0: packed struct",
            "url": "https://ziglang.org/documentation/0.17.0/#packed-struct"
          },
          {
            "title": "Zig 0.17.0: bitCast",
            "url": "https://ziglang.org/documentation/0.17.0/#bitCast"
          },
          {
            "title": "Zig 0.17.0: popCount",
            "url": "https://ziglang.org/documentation/0.17.0/#popCount"
          },
          {
            "title": "Zig 0.17.0: Operators",
            "url": "https://ziglang.org/documentation/0.17.0/#Operators"
          }
        ],
        "sourceKeys": [
          "transfer"
        ],
        "reference": "packed-struct"
      },
      {
        "id": "zig-bounded-queue",
        "title": "Build a bounded generic queue",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Use a comptime type factory without per-operation allocation.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nA type factory specializes the element type and capacity at compile time. Embedded array storage makes capacity explicit and avoids per-operation allocation. Full and empty are ordinary outcomes to handle. This synchronous queue has no synchronization protocol: using it across threads would require an additional design for ownership, ordering, and data-race avoidance.\n\n## Syntax before you solve\n@compileError(\"message\") reports a compile-time error if that branch is evaluated; capacity is a comptime argument, so it can reject zero capacity before runtime. @This() names the enclosing struct, here stored as Self for method parameter types. undefined leaves array slots uninitialized: only pop slots that push has already written. To wrap an index, remainder % capacity yields a position below capacity. Widen before adding indices, then narrow only after that bound is established.",
        "task": "Fix Queue(T, capacity) so push/pop implement FIFO ordering, wrap around within the embedded array, return error.Full when full, and null when empty. capacity is positive. Preserve count and read_index as u32. Test with different element types. Avoid allocation and recursion. The starter is accidentally a stack.",
        "starter": "pub fn Queue(comptime T: type, comptime capacity: u32) type {\n    return struct {\n        items: [capacity]T = undefined,\n        read_index: u32 = 0,\n        count: u32 = 0,\n        const Self = @This();\n        pub fn push(self: *Self, value: T) !void {\n            if (self.count == capacity) return error.Full;\n            self.items[self.count] = value;\n            self.count += 1;\n        }\n        pub fn pop(self: *Self) ?T {\n            if (self.count == 0) return null;\n            self.count -= 1;\n            return self.items[self.count];\n        }\n    };\n}\n",
        "solution": "pub fn Queue(comptime T: type, comptime capacity: u32) type {\n    if (capacity == 0) @compileError(\"capacity must be positive\");\n    return struct {\n        items: [capacity]T = undefined,\n        read_index: u32 = 0,\n        count: u32 = 0,\n        const Self = @This();\n        pub fn push(self: *Self, value: T) !void {\n            if (self.count == capacity) return error.Full;\n            const write_index = (@as(u64, self.read_index) + self.count) % capacity;\n            self.items[@intCast(write_index)] = value;\n            self.count += 1;\n        }\n        pub fn pop(self: *Self) ?T {\n            if (self.count == 0) return null;\n            const value = self.items[self.read_index];\n            self.read_index = if (self.read_index + 1 == capacity) 0 else self.read_index + 1;\n            self.count -= 1;\n            return value;\n        }\n    };\n}\n",
        "tests": "test \"FIFO, wraparound, backpressure\" {\n    var queue = learner.Queue(u32, 2){};\n    try std.testing.expectEqual(@as(?u32, null), queue.pop());\n    try queue.push(10);\n    try queue.push(20);\n    try std.testing.expectError(error.Full, queue.push(30));\n    try std.testing.expectEqual(@as(?u32, 10), queue.pop());\n    try queue.push(30);\n    try std.testing.expectEqual(@as(?u32, 20), queue.pop());\n    try std.testing.expectEqual(@as(?u32, 30), queue.pop());\n    try std.testing.expectEqual(@as(?u32, null), queue.pop());\n    var bytes = learner.Queue(u8, 1){};\n    try bytes.push(7);\n    try std.testing.expectEqual(@as(?u8, 7), bytes.pop());\n}\n",
        "hints": [
          "The write position is (read_index + count) modulo capacity.",
          "Pop from read_index, advance it with wraparound, then decrement count. Widen the index addition to avoid an intermediate u32 overflow."
        ],
        "references": [
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "Zig 0.17.0: Generic Data Structures",
            "url": "https://ziglang.org/documentation/0.17.0/#Generic-Data-Structures"
          },
          {
            "title": "Zig 0.17.0: compileError",
            "url": "https://ziglang.org/documentation/0.17.0/#compileError"
          },
          {
            "title": "Zig 0.17.0: This",
            "url": "https://ziglang.org/documentation/0.17.0/#This"
          },
          {
            "title": "Zig 0.17.0: undefined",
            "url": "https://ziglang.org/documentation/0.17.0/#undefined"
          }
        ],
        "sourceKeys": [],
        "reference": "Generic-Data-Structures"
      },
      {
        "id": "zig-completion-callback",
        "title": "Recover the completion’s owner",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Connect an embedded callback object to explicit state.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). The pinned upstream source uses Zig 0.14.1; source excerpts are provided for comparison.\n\n## Why this pattern matters\nAn embedded completion lets a callback recover the larger object that owns the operation. @fieldParentPtr works only for the actual field inside a live and correctly aligned parent. Keep that parent at a stable address until the operation completes. The exercise calls back synchronously; in asynchronous IO, cancellation and teardown must also respect the outstanding completion lifetime.",
        "task": "Implement complete(completion). Recover its live Owner using @fieldParentPtr(\"completion\", completion), add completion.value to owner.total, and increment owner.calls once. Keep the callback function pointer and dispatch helper. dispatch is synchronous; a real IO owner would need to remain alive until later completion.",
        "starter": "pub const Completion = struct {\n    value: u32 = 0,\n    callback: *const fn (*Completion) void = complete,\n};\npub const Owner = struct {\n    total: u64 = 0,\n    calls: u32 = 0,\n    completion: Completion = .{},\n};\npub fn complete(completion: *Completion) void {\n    _ = completion;\n}\npub fn dispatch(owner: *Owner, value: u32) void {\n    owner.completion.value = value;\n    owner.completion.callback(&owner.completion);\n}\n",
        "solution": "pub const Completion = struct {\n    value: u32 = 0,\n    callback: *const fn (*Completion) void = complete,\n};\npub const Owner = struct {\n    total: u64 = 0,\n    calls: u32 = 0,\n    completion: Completion = .{},\n};\npub fn complete(completion: *Completion) void {\n    const owner: *Owner = @fieldParentPtr(\"completion\", completion);\n    owner.total += completion.value;\n    owner.calls += 1;\n}\npub fn dispatch(owner: *Owner, value: u32) void {\n    owner.completion.value = value;\n    owner.completion.callback(&owner.completion);\n}\n",
        "tests": "test \"embedded owner and independent state\" {\n    var first = learner.Owner{};\n    var second = learner.Owner{};\n    learner.dispatch(&first, 5);\n    learner.dispatch(&first, 7);\n    learner.dispatch(&second, 3);\n    try std.testing.expectEqual(@as(u64, 12), first.total);\n    try std.testing.expectEqual(@as(u32, 2), first.calls);\n    try std.testing.expectEqual(@as(u64, 3), second.total);\n    try std.testing.expectEqual(@as(u32, 1), second.calls);\n}\n",
        "hints": [
          "Give the inferred parent pointer an explicit *Owner type.",
          "Update only that owner; separate instances must not share global counters."
        ],
        "references": [
          {
            "title": "state_machine.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/state_machine.zig"
          },
          {
            "title": "Zig 0.17.0: fieldParentPtr",
            "url": "https://ziglang.org/documentation/0.17.0/#fieldParentPtr"
          }
        ],
        "sourceKeys": [
          "state-machine"
        ],
        "reference": "fieldParentPtr"
      },
      {
        "id": "zig-quiz-tigerbeetle-features",
        "title": "Checkpoint: TigerBeetle Zig patterns",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Does extern struct guarantee there is no padding?",
            "options": [
              "Yes, for every struct",
              "No; inspect size, alignment and offsets",
              "Only for u128 fields"
            ],
            "answer": 1,
            "explanation": "extern controls ABI-compatible layout but padding may still be inserted. The actual source checks its layout explicitly."
          },
          {
            "prompt": "What does a comptime type factory return?",
            "options": [
              "A specialized type whose parameters are known at compilation",
              "An allocated instance on every call",
              "An OS thread"
            ],
            "answer": 0,
            "explanation": "Returning a type lets the compiler specialize storage size and element behavior without runtime type selection."
          },
          {
            "prompt": "When is @fieldParentPtr valid?",
            "options": [
              "For any pointer with the same numerical address",
              "Only after copying arbitrary bytes",
              "When the pointer really addresses that field of a live parent"
            ],
            "answer": 2,
            "explanation": "The parent’s layout, lifetime, and alignment must be correct. The builtin does not make an invalid lifetime safe."
          },
          {
            "prompt": "What is the bounded queue’s response to overload?",
            "options": [
              "Grow without limit",
              "Return Full without silently dropping a value",
              "Overwrite the oldest entry"
            ],
            "answer": 1,
            "explanation": "A fixed capacity and explicit Full error make resource limits visible to the caller."
          }
        ]
      }
    ]
  }
];

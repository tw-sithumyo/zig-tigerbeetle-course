import { ZIG_VERSION, TB_COMMIT } from './config.mjs';

export const zigReference = (anchor) => ({
  title: `Zig ${ZIG_VERSION}: ${anchor.replaceAll('-', ' ')}`,
  url: `https://ziglang.org/documentation/${ZIG_VERSION}/#${anchor}`,
});
const reading = (id, title, minutes, description, body, anchors, references = []) => ({
  id, title, kind: 'reading', minutes, description, body,
  reference: anchors[0], references: [...anchors.map(zigReference), ...references],
});

// Theory sits immediately before the exercises that make each idea concrete.
export const zigTheoryLessons = {
  'first-sparks': reading('zig-why', 'Why Zig, and when to choose it', 10,
    'Connect language design to a workload, and understand the cost of explicit control.',
    `## Start with a requirement
Imagine a service that must process a bounded batch without allocating during the request. Zig lets the implementation expose its buffers, integer widths, allocation failures, and cleanup. That control is useful for native tools, libraries, embedded software, and storage systems. It also gives the programmer more responsibilities: a compiler cannot decide the correct lifetime or ownership of every pointer for you.

## What the language makes explicit
A function call is visible at its call site; allocation normally comes through an allocator argument; an error union makes failure part of the return type. Compile-time execution uses the same language to construct types and check relationships. These properties help a reviewer connect code to resource and failure budgets. They do not automatically make a program fast or correct.

## Choose with tradeoffs in mind
For an application whose main need is an existing framework or quick changes to business workflows, evaluate your team's existing language and ecosystem first. For a component whose requirements involve a C ABI, binary layouts, bounded memory, or platform-specific behavior, build a small Zig prototype and measure it. Record target platforms, library availability, debugging needs, and the maintenance cost of compiler upgrades. These are decision criteria for this course, not a universal ranking of languages.

## Why this connects to TigerBeetle
TigerBeetle's engineering rules call for bounded work, allocation at initialization, explicit layouts, and strong assertions. Zig gives its authors tools to express those choices: arrays and slices, sized integers, allocators, comptime, and direct platform interfaces. The database's replication protocol, data model, and tests establish properties that the choice of language alone cannot provide. TigerStyle is the project's policy, not a rule imposed on every Zig application.

## Practice and explain
Complete the following exercises. For each function, identify its input types, return type, observable effects, and possible failures. Then name one requirement in your own project that benefits from Zig and one cost your team would accept. Use the course's Zig ${ZIG_VERSION}; upstream TigerBeetle has a separate compiler pin.`,
    ['Introduction', 'Functions'], [
      { title: 'Official Zig overview', url: 'https://ziglang.org/learn/overview/' },
      { title: 'TigerStyle: engineering constraints at the course commit', url: `https://github.com/tigerbeetle/tigerbeetle/blob/${TB_COMMIT}/docs/TIGER_STYLE.md` },
    ]),

  'data-shapes': reading('zig-data-theory', 'Representations, ranges, and borrowed bytes', 10,
    'Choose a representation by what it can express and who keeps its storage alive.',
    `## A type is a set of possible values
An unsigned 8-bit integer has 256 values, from 0 through 255. A signed type spends part of its range on negative values. Choose widths from the domain or protocol; use usize for the target-sized indexing APIs that require it. A wider accumulator postpones overflow but never removes the need for a bound.

## Conversion is a contract
Widening an unsigned quantity into a sufficiently wide type preserves its value. Narrowing needs a range argument. @intCast asks for a representable value; @truncate deliberately discards high bits. Neither should stand in for validating external input. For example, reject an out-of-range packet length before narrowing it to a protocol field. The casting exercise practices a checked boundary.

## Storage and views
[4]u8 is four bytes of array storage; []const u8 is a read-only slice view containing a pointer and length. Taking a slice does not allocate or extend the backing storage's lifetime. A const binding prevents changing that binding; it does not necessarily make all memory reachable through it immutable. A mutable slice can still mutate its elements when its binding is const.

## Text is encoded data
Zig string literals are UTF-8 bytes with a sentinel in their literal representation. A normal []const u8 view is length-delimited; do not assume it is NUL-terminated for C. Byte length is not a count of displayed characters, and arbitrary byte slicing can split an encoding sequence. Use byte-oriented parsing for a deliberately ASCII protocol, and use appropriate decoding when the requirement concerns Unicode text.

## Practice and explain
The array exercise owns storage; the slice exercise borrows it. Draw the owner and view, then explain what happens if the owner goes out of scope. For an amount field, state the integer width, scale, maximum accepted input, and overflow policy before writing the conversion.`,
    ['Integers', 'Casting', 'Slices', 'String-Literals-and-Unicode-Code-Point-Literals']),

  'control-flow': reading('zig-control-theory', 'Control flow, invariants, and work bounds', 8,
    'Use expressions and exhaustive cases to make behavior reviewable.',
    `## Selection produces a value
if and switch can be expressions. A result can be assigned once instead of repeatedly mutating a variable in several branches. Branch types must combine into a valid result type. An exhaustive switch over an enum makes an added state visible to the compiler; a catch-all branch can hide the need to handle that new state explicitly.

## A loop needs an argument for termination
for is a natural choice when visiting a slice. while describes a condition, iterator, or state transition. For each loop, name the bound or the quantity that moves toward termination. A request that processes at most 64 entries has a reviewable work budget; an unbounded input stream needs an explicit limit or cancellation policy.

## Invariants explain more than examples
For a running total, an invariant is that total equals the sum of the entries already processed, provided arithmetic remains representable. Initialize it before the loop, preserve it in each iteration, and use it to explain the result at exit. Empty input tests the initialization; boundary values test the arithmetic assumption. A passing typical example does not establish either property.

## Practice and explain
Before solving the loop exercise, predict the empty-input result and the maximum number of iterations. Before solving the switch exercise, list every state and its result. Explain whether a new enum member should produce a compiler error or intentionally share a fallback. Later, apply the same reasoning to bounded TigerBeetle batches.`,
    ['if', 'for', 'while', 'switch']),

  'model-world': reading('zig-model-theory', 'Model states before writing branches', 8,
    'Distinguish a record, a closed choice, and a choice with a payload.',
    `## Records group facts that coexist
A struct combines fields that exist together. An account description might have an identifier, an asset code, and a status. A method is a function associated with that namespace; value.method() passes value as the first argument. Choose a value receiver for observation or a pointer receiver when the function must change the original.

## Choices exclude alternatives
An enum gives names to a closed set of states. A tagged union adds state-specific data: a deposit carries an amount while a heartbeat carries no amount. Compare that with a struct containing is_deposit, is_withdrawal, and an optional amount: the latter admits contradictory flag combinations. A useful model reduces the invalid combinations that later code must reject.

## Types do not validate every domain rule
A u32 amount excludes negative values but still admits zero. A correctly tagged withdrawal can still exceed available funds. Keep those business checks at the boundary responsible for enforcing them. Exhaustive switching proves coverage of variants, not that every amount or state transition is allowed.

## Memory layout is a separate contract
An ordinary struct is a convenient language-level record, not a portable serialization format. Use an explicitly designed encoding for files and networks. extern and packed types have specific layout purposes that the final Zig chapter explores; neither makes unchecked foreign bytes trustworthy.

## Practice and explain
Sketch a payment state as pending, posted, or voided. List which data belongs to each state, and which transitions require validation. Then implement the struct, enum, and tagged-union exercises and explain one invalid combination each representation prevents.`,
    ['struct', 'enum', 'Tagged-union', 'extern-struct', 'packed-struct']),

  'honest-contracts': reading('zig-contract-theory', 'Absence, errors, and illegal behavior', 10,
    'Separate normal outcomes from programmer mistakes before choosing a return type.',
    `## Three different contracts
Use ?T when a valid operation can find nothing, such as a search without a match. Use E!T when it can fail for a named reason, such as invalid input or exhausted capacity. Reserve assertions for internal invariants that correct code must satisfy. A rejected user request is an expected outcome, not evidence that the process should panic.

## Propagation is a control-flow decision
try unwraps success or returns the error to the caller. catch chooses local recovery or translation into another error. orelse handles absence. Avoid catch unreachable for IO or user input that really can fail. If a public API translates errors, keep enough diagnostic context to explain a failure without exposing internal details unnecessarily.

## Safety checks are not ownership proofs
Debug and ReleaseSafe normally check many forms of illegal behavior, including bounds and arithmetic errors. ReleaseFast and ReleaseSmall normally disable these runtime checks. Disabling a check does not make an invalid operation legal or define its result. Build modes also do not add a borrow checker: stale pointers, incorrect lifetimes, and data races still require design and review.

## Arithmetic policy must be intentional
For ordinary arithmetic, overflow is illegal behavior. Wrapping, saturating, and overflow-reporting operations express different policies. Saturating an accounting sum silently changes the amount; use checked arithmetic and return an error when that is the required contract. In the division exercise, validate both a zero divisor and the signed minimum divided by minus one.

## Practice and explain
For a capacity-limited queue, classify empty, full, malformed input, and a corrupted internal index. Explain which cases use an optional, an error, or an assertion. State the intended optimization mode and run meaningful tests with safety enabled before considering other modes.`,
    ['Optionals', 'Errors', 'Illegal-Behavior', 'Optimization-Mode', 'Integer-Overflow']),

  'memory': reading('zig-memory-theory', 'Ownership is a protocol between functions', 12,
    'Make allocation, borrowing, cleanup, and failure paths visible.',
    `## Storage lifetime and object lifetime
A pointer is an address with a type; it does not keep the pointed-to storage alive. A returned slice can borrow caller-owned input or own an allocation, but its []u8 type alone does not tell the caller which. Document the owner, valid lifetime, whether mutation is allowed, and which operation releases it. Returning a pointer to a dead stack local violates that contract even if the address still appears readable.

## Select an allocator from the lifetime
For a bounded request, a fixed buffer can give a hard allocation budget and fail when it is exhausted. An arena groups allocations under one lifetime; resetting or deinitializing it invalidates all borrowed references into it. A general-purpose allocator fits independently lived objects but still requires correct release. Test code can use std.testing.allocator to detect leaked allocations. Allocator names and APIs can change with the compiler version, so consult the pinned standard library.

## Pair acquisition with cleanup
Register defer immediately after acquiring a resource that this scope owns. Use errdefer while building an object whose ownership transfers only on success: release already acquired pieces if a later step fails. Do not defer freeing a buffer that is successfully returned to its new owner. A deinit function is a useful convention for releasing a struct's owned resources; Zig does not call it automatically as a destructor.

## Failure is part of the design
An allocation can return OutOfMemory. A test that exercises only successful allocation misses the cleanup path that matters under pressure. The errdefer exercise injects allocation failure and checks for leaks. Such tests demonstrate selected ownership paths; they do not prove every pointer lifetime in the program.

## Practice and explain
Draw the ownership transfer in duplicate: caller input is borrowed, the returned copy is owned, and the caller frees it. Then explain how a request arena could simplify many temporary allocations, and why storing a slice from that arena in a longer-lived account record would be wrong. TigerBeetle takes a stricter route for its event loop: derive bounds and allocate its working memory during initialization.`,
    ['Memory', 'Lifetime-and-Ownership', 'defer', 'errdefer', 'Report-Memory-Leaks']),

  'compile-time': reading('zig-comptime-theory', 'Specialize at compile time, verify at runtime', 10,
    'Use comptime to express structure, and tests to challenge behavior.',
    `## Two stages, one language
comptime parameters must be known during compilation. A function can accept a type and a capacity, then return a struct containing an array of that type and length. This is how a bounded queue can specialize its storage without a runtime type descriptor. Runtime input cannot become compile-time knowledge merely because a declaration says comptime; the compiler rejects that dependency.

## Use specialization for a reason
Compile-time checks can reject unsupported types, impossible capacities, or mismatched binary layouts before the program runs. More specializations can also increase compile time and generated code size. A simple runtime branch may be preferable when the alternatives do not change the representation. Measure the tradeoff rather than assuming every comptime abstraction is free.

## Compile-time and runtime checks answer different questions
A size assertion can establish a layout relationship for a target. A unit test can establish behavior for its executed inputs. Neither proves correct handling of every possible network history. Test empty and maximum-sized inputs, overflow, duplicate actions, and allocation failure when relevant. Property-based testing expresses relationships over many generated inputs; deterministic simulation controls dependencies such as time, storage, and scheduling to reproduce a failure sequence.

## Practice and explain
In the array exercise, identify the argument that fixes the return type. In the generic exercise, explain which operations the supplied type must support. For the algorithm exercise, write one boundary case before implementing it. Later compare these tests with TigerBeetle's VOPR: repeatable execution requires the code revision and configuration as well as a seed.`,
    ['comptime', 'Generic-Data-Structures', 'Zig-Test']),

  'ledger-project': reading('zig-project-theory', 'From checked functions to a usable program', 12,
    'Connect the parser project to builds, modules, IO boundaries, and delivery.',
    `## Keep the core easy to test
The next exercises form a parsing and reporting core. An application adds input/output around it: read a bounded input, validate its syntax, call the core, format a result, and release owned resources. Keep parsing errors distinct from failures to open, read, or write a file. The course's signed-entry ledger is a programming exercise; it lacks TigerBeetle's double-entry model, durability, concurrency control, and idempotent records.

## Build with a pinned toolchain
Use zig version before following an example. zig fmt formats source, zig test runs test declarations, and zig build-exe creates an executable. For a multi-file project, @import creates module dependencies and build.zig defines the build graph. build.zig.zon describes package metadata and dependencies. Pin compiler and dependency versions together; a compiler upgrade can change both language rules and library interfaces.

## Try the generated project outside this editor
In a new empty directory, use the course compiler and inspect the files it generates:

\`\`\`sh
zig version
zig init
zig build
zig build test
zig build run
\`\`\`

These commands describe a standalone project, not extra commands accepted by the exercise editor. The generated build file is the best starting example for your installed version. A project's named steps such as run and test must be defined by that build file; they are not guaranteed in every repository. Read zig build --help for the project's actual options.

## Targets and interfaces
Cross-compilation selects a target architecture, operating system, and ABI. Producing a binary for another target does not test it on that target. C interoperability can connect Zig to existing libraries, but matching integer widths, calling conventions, ownership, alignment, and string termination remains your responsibility. Keep these boundaries small and test them on the supported platforms.

## A project review you can use
Finish the three checked exercises, then outline a CLI with a maximum input size, explicit overflow handling, and a documented output format. Explain who owns each input buffer, how failures reach the user, and which target/mode was tested. For an independent follow-up, implement that CLI in a separate directory using the generated build and the version-matched IO examples. This extension is a review task, not an automatically graded course exercise.`,
    ['Zig-Build-System', 'import', 'C', 'Memory'], [
      { title: 'Official build-system guide (check against your compiler version)', url: 'https://ziglang.org/learn/build-system/' },
    ]),
};

# Zig TigerBeetle Course

A Boot.dev-inspired Zig and TigerBeetle learning app that runs on your own computer. Lessons, code editing, compilation, database labs, tests, quizzes, and progress all stay local. No account, API key, hosted runner, or subscription.

Two learning paths contain **102 units, 23 theory lessons, 59 exercises, and 73 quiz questions**. Every exercise has an explanation, assignment, failing starter, checks, progressive hints, and a reference solution. Every reading and exercise links to primary references. This is a structured path toward project fluency: completion is evidence of practice, not a certification of mastery or production readiness.

| Path | Chapters | Theory | Exercises | Quizzes / questions |
| --- | --- | --- | --- | --- |
| Zig foundations | 10 | 11 lessons | 35 local Zig exercises | 10 / 32 |
| TigerBeetle project | 10 | 12 lessons | 11 live DB labs, 10 Zig models, 2 source investigations, 1 upstream build/test | 10 / 41 |

## Start

**Windows:** follow the [Windows setup guide](docs/WINDOWS.md). Use **WSL2 + Ubuntu for both complete paths**, including live TigerBeetle labs and the upstream Zig build. The guide also covers the native PowerShell route for Zig exercises, shell-specific commands, moving the project, and troubleshooting.

Use Node.js 22.13 or later. On Linux/macOS, `tar` with xz support is needed for compiler setup. For a new checkout:

```sh
git clone https://github.com/tw-sithumyo/zig-tigerbeetle-course.git
cd zig-tigerbeetle-course
npm run setup
npm run setup:tigerbeetle
npm start
```

If you are using the original local workspace, start it from its existing path:

```sh
cd /home/stm/my-projects/zig-tigerbeetle-course
npm run setup
npm run setup:tigerbeetle
npm start
```

Open **http://localhost:3030** and select **Zig foundations** or **TigerBeetle project** in the sidebar. On this machine, both environments are already installed; `npm start` is enough. Open the TigerBeetle path directly at **http://localhost:3030/#course/tigerbeetle**. There are no server runtime npm dependencies. The optional Vim editor ships as a prebuilt local bundle, so starting the app does not require npm install or a frontend build. Setup can be skipped for the path you do not need.

`npm run setup` downloads **Zig 0.17.0** from ziglang.org, verifies the archive's SHA-256 against the official download index, and installs it in `.tools/zig-0.17.0/`. It does not change your system Zig or shell PATH. Setup needs internet access; normal operation does not. The Zig archive includes an offline language reference, available at `/reference`.

Linux and macOS x64/ARM64 have automatic setup. Native Windows x64/ARM64 Zig setup uses PowerShell archive extraction; Windows-specific behavior has not been verified here. You can instead extract the official Zig archive yourself and set `ZIG_BIN` to its executable. Compiler and course versions must match. Linux is the platform verified for this project; the Windows guide explains the WSL2 route and its verification limits.

`npm run setup:tigerbeetle` installs the official **TigerBeetle 0.17.9** release with a pinned SHA-256, clones its source at **cc1c06a924e49b11089c521b2209d34c92caaf18**, and runs that checkout's compiler download script to install **Zig 0.14.1** separately. It requires Git, `unzip`, `tar`, xz support, and curl or wget on Linux/macOS. WSL2 is the recommended Windows path for these labs. The source checkout retains its upstream license. The normal live/source/unit-test lab workflow works offline after setup; external documentation links and optional broader upstream suites may need internet access.

The two Zig versions are intentional: the foundations/model exercises use 0.17.0; the real upstream build uses TigerBeetle's required 0.14.1. Neither replaces a global compiler. A live lab temporarily needs roughly 1.1 GiB of disk for a formatted data file and the replica's startup memory (about 1.5 GiB reported by this development configuration). The data file is removed afterward.

```sh
# Optional overrides. Use an absolute executable path for ZIG_BIN.
PORT=3031 npm start
ZIG_BIN=/path/to/zig-0.17.0/zig npm start
ZIG_TIGERBEETLE_COURSE_DATA=/path/to/my/progress npm start
TIGERBEETLE_BIN=/path/to/tigerbeetle-0.17.9 npm start
```

## Learning

- Start with **Your local workshop** in Zig foundations, or **What your team is building** in the TigerBeetle path. You can pick any chapter; progress and resume positions are tracked separately while XP is shared. Existing Zig progress remains compatible.
- Edit `main.zig` and choose **Check solution** (Ctrl/Cmd+Enter). Actual local compiler/test output appears below the editor. Only successful course checks complete an exercise.
- The **Tests** tab shows the read-only course checks. **My tests** runs test blocks in your file without completing the exercise. **Build** compiles without executing. **Format** runs `zig fmt`.
- Hints reveal one at a time. Viewing a reference solution is recorded, and loading one still requires running the checks. Exercise checks support learning; they are not an anti-cheating system.
- Quiz results include explanations. All questions must be correct to complete a checkpoint. Retry freely. XP is awarded once: 100 per exercise, 75 per quiz, 25 per theory lesson.
- Use **Playground** for independent programs and test blocks. **Save file** downloads the source. Builds use a temporary directory, which is removed after each command. To keep a binary, download your source and run `zig build-exe main.zig` in your own directory.
- Open **Display** (the **Aa** button) to adjust **code**, **course text**, and **navigation menu** sizes independently. Sliders and +/− buttons preview changes immediately; **Reset sizes** restores the defaults. Preferences stay in this browser across reloads, separately from course progress. Code size applies to the regular and Vim editors, tests, examples, and terminal output.
- Select **Vim: off** in the editor toolbar to enable Vim keybindings. **i/a/o** enter Insert mode, **Esc** returns to Normal, **v/V/Ctrl+v** select characters/lines/blocks. Motions, operators, yank/paste, undo/redo, search, and **:w** work in the browser; **Keys** opens the reference. The preference persists in this browser. Tests remain read-only, and Ctrl/Cmd+Enter still checks/runs code. The local bundle provides Vim-style editing without loading a Neovim process or its plugins.
- Drafts save automatically. **Export progress** downloads a JSON backup. Copy `.data/progress.json` back into the data directory with the server stopped to restore a backup; there is no in-app import.

## Course

Each Zig chapter pairs theory with practice. The opening **Why Zig, and when to choose it** lesson explains workload fit, explicit control, ecosystem/toolchain costs, and the connection to TigerBeetle. Later theory covers representation and UTF-8 bytes, loop invariants, state modeling, runtime safety modes, ownership and allocator lifetimes, compile-time specialization, and the path from tested functions to a standalone project.

| Chapter | Topics |
| --- | --- |
| First sparks | Why/when Zig, tradeoffs, local workflow, hello world, constants, variables, functions |
| Give data a shape | Ranges, checked conversion, arrays, borrowed slices, UTF-8 and byte strings |
| Choose your path | If expressions, iteration, termination bounds, invariants, exhaustive switching |
| Model a small world | State modeling, struct methods, enums, tagged union payloads, layout boundaries |
| Write honest contracts | Pointers, absence versus errors, assertions, overflow policy, build safety modes |
| Own your memory | Ownership/borrowing, allocator selection, defer, errdefer, allocation-failure testing |
| Think at compile time | Specialization tradeoffs, comptime array lengths, generic functions, test properties |
| Build: a tiny ledger | Strict parsing, multi-line input, reports, modules/builds, IO and C/target boundaries |
| Write in TigerStyle | Naming, units, options structs, external validation versus internal assertions, bounded work, overflow |
| Read TigerBeetle's Zig | Packed flags, type factories, `@This`, bounded queues, function pointers, `@fieldParentPtr`, ABI/comptime/platform patterns, explicit byte-order decoding |

The last two chapters are **inside the Zig learning path**, with seven additional coding exercises and eight quiz questions. They use source excerpts from the pinned TigerBeetle project and source-inspired examples. Tests verify behavior; `zig fmt` and passing tests do not replace a TigerStyle design review.

## TigerBeetle project path

| Chapter | Theory and practice |
| --- | --- |
| Meet TigerBeetle | Why/when to use it, selection tradeoffs, trust boundary, real account creation and transfers |
| Model accounts and assets | Worked double-entry example, integer scale, exact decimal parsing, u128 balance model, separate ledgers |
| Submit safely, batch deliberately | Durable end-to-end IDs, ambiguity, exact retries, intent comparison, dense 0.17 results, linked rollback, batching/latency/backpressure |
| Enforce the invariant | Atomic balance policies, overdraft rejection, pending availability |
| Reserve, settle, or release | Pending, partial posting, voiding, expiry semantics and immutable resolution records |
| Read and reconcile | Real transfer/balance history queries, checked pagination cursors, overflow-safe reconciliation model |
| Build a reliable wallet flow | Holds, fees, linked retries, corrections, SDK lifecycle, durable intent/outbox design, crash windows |
| Find your way around the source | Actual module/handler discovery, ABI layout, allocation and callback ownership |
| Order, replicate, recover | Strict serializability, safety/liveness, VSR, different quorum thresholds, WAL/LSM/checkpoints |
| Test, recover, contribute | Bounded replay, real restart persistence and upstream test, VOPR, lost-replica recovery, monitoring/runbooks |

Live exercises edit **commands.tb**, a semicolon-delimited TigerBeetle REPL script. Each Run/Check creates its own empty development replica, applies the documented fixture, executes commands individually, and removes the entire database. **Run commands** displays responses; only **Check solution** verifies state and awards completion. No existing cluster, production data file, or remote endpoint is used. Business rejections such as `exceeds_credits` can be the expected result of a successful lesson. The capstone also demonstrates that a repeated linked batch can report `exists` for one member and `linked_event_failed` for others; it requires looking up and comparing the original payloads.

Source investigations edit **evidence.json** and check answers against actual local source declarations. Source buttons display allowlisted local excerpts with line numbers and pinned upstream links. The **upstream build/test** exercise invokes the checkout's real `./zig/zig build test:unit --summary all -- sum_overflows`, requires successful test execution, and uses its own Zig 0.14.1. It does not accept arbitrary shell commands. Cold builds can take several minutes. The course uses a bounded focused test; it does not claim that this is the full upstream test suite.

The ten TigerBeetle Zig model exercises are explicitly labeled teaching models. They do not implement the production accounting state machine or VSR. The real database labs are separate from these models. The final review asks for an SDK implementation of the wallet flow, a source trace, a meaningful new boundary test in a separate working clone, and an operational recovery discussion with your team.

The boundary exercises add exact decimal-to-integer parsing, comparison of durable retry intents, and timestamp cursor arithmetic to the TigerBeetle path. The Zig path adds explicit byte-order decoding with length and version validation. Each has boundary checks, a failing starter, progressive hints, and a reference solution. These application-side models prepare you for SDK integration; they do not replace the live database labs.

## Coverage and references

The curriculum review found substantial existing database practice, but thin Zig theory, limited technology-selection guidance, and generic introductions to several exercises. The additions supply eight Zig theory lessons, two TigerBeetle decision/performance lessons, expanded database theory, and explanations tailored to the models and labs. Four additional prerequisite exercises teach integer widening, range-checked narrowing, maximum selection, and checked addition before later tasks need them. Existing exercise IDs and behavior contracts remain intact so saved code and progress continue to refer to the same tasks. Reference solutions use explained syntax, and assignments distinguish a required learning constraint from an optional implementation choice. For example, comparison-based and builtin-based integer caps both pass.

| Learning goal | Where to study it | Evidence and limits |
| --- | --- | --- |
| Explain why and when to use Zig | Why Zig; chapter theory; TigerStyle | Workload/maintenance decision prompts; performance still requires measurement |
| Use Zig and explain its semantics | Types, flow, contracts, memory, comptime, project chapters | 35 compiler-checked exercises; standalone CLI, C integration, and cross-target execution are follow-up work |
| Explain why and when to use TigerBeetle | Why TigerBeetle; batching/resources; architecture | Decision record and benchmark design; local labs do not establish production capacity |
| Use the database correctly | Modeling, retries, invariants, pending transfers, queries, wallet | 11 live labs; SDK/outbox and external settlement recovery are explained and assigned for independent implementation |
| Explain the implementation and its guarantees | Source, VSR, testing/operations; final Zig chapters | Source evidence, ten teaching models, one upstream test, and a healthy-disk restart; no full distributed-failure or production-recovery certification |

References distinguish **versioned behavior** from **general guidance**. Zig language links target [the course's 0.17.0 reference](https://ziglang.org/documentation/0.17.0/); the same sections remain available through each relevant lesson's **Language reference (offline)** link. The [official overview](https://ziglang.org/learn/overview/) and [build-system guide](https://ziglang.org/learn/build-system/) are living documents, so check examples against the installed compiler and its generated project.

TigerBeetle lessons cite the course commit, including [system architecture](https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/system-architecture.md), [reliable submission](https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/reliable-transaction-submission.md), [the Node SDK](https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/clients/node/README.md), and [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md). Individual lessons link to the specific API, protocol, storage, testing, and operations sources they discuss. Course decision prompts and integration designs are teaching applications of those contracts, not additional database guarantees. External links need internet; pinned source documents also exist in the local checkout after setup.

## Execution and storage

The server binds to `127.0.0.1` and accepts only localhost hosts and same-origin requests. Mutations require a random per-server session token. It serves public assets, the language reference, and specific allowlisted source excerpts; arbitrary source paths, progress files, and toolchain files are not directly served. This is a personal local tool, not a multi-user server.

On Linux, if Bubblewrap (`bwrap`) is installed and user namespaces are permitted, compiler jobs run with network, process, and filesystem namespaces. Only system runtime directories, the read-only Zig toolchain, the job workspace, and compiler cache are mounted. Your home directory is not mounted. On this machine Bubblewrap is available and enabled. On other platforms, or when Bubblewrap cannot run, execution falls back to native processes with your user permissions; the Environment dialog shows the active mode. `ZIG_TIGERBEETLE_COURSE_SANDBOX=off` explicitly selects native execution. Native mode is for your own code and trusted examples.

Zig exercise jobs have a 35-second wall time and a 64 KiB output limit. Linux `prlimit`, when present, adds CPU, address-space, file-size, and core-dump limits. Live TigerBeetle labs have a 90-second wall limit, bounded commands/output, and use an isolated loopback network inside Bubblewrap when available; the REPL and replica share that private namespace. The trusted upstream build runs locally in its pinned checkout, with a 180-second limit and its persistent build cache. This source build is not a sandbox for arbitrary student commands. Each runner rejects additional jobs while it is busy. Do not expose this service to the internet.

- `.tools/`: project-local compiler and bundled docs.
- `.data/progress.json`: drafts, completions, quiz answers/results, and solution-view records. Writes use atomic file replacement. Back up this file to keep your work.
- `.data/cache/`: persistent compiler cache; safe to delete with the server stopped.
- `.data/work/`: temporary per-job sources, removed after execution. An interrupted server can leave folders here; safe to delete with the server stopped.
- `.data/tigerbeetle-work/`: disposable live-lab databases, removed on completion. Clean up only with the server stopped if an interrupted run leaves files behind.
- `.tools/tigerbeetle-source-0.17.9/`: pinned upstream source, its separate `zig/` installation, and upstream build cache. Use a separate clone for your own project changes.

Run one app server per data directory. An unreadable progress file causes startup to fail without overwriting your work.

## Verify

```sh
npm test
npm run test:course
npm run test:alternatives
npm run test:tigerbeetle
```

The tests cover real compilation/database operations, durable drafts, one-time XP, quiz grading, separate resume positions, local-request guards, source-excerpt allowlists, formatting, building, compiler failures, and output limits. Environment-dependent tests skip when the relevant tool is not installed. `test:course` checks all **45 Zig reference solutions and starters** across both paths. `test:tigerbeetle` checks all **14 live/source/upstream reference solutions and starters**, including linked rollback/retry, allocation-independent account policies, real restart persistence, and the actual upstream test.

`test:alternatives` also compiles eight equivalent implementations, including comparisons versus @min/@max, typed widening versus @as, checked arithmetic without an overflow builtin, and @splat versus element assignment. These pass the same normal course checks.

An optional browser check lives in `scripts/check-ui.mjs`. It requires `playwright-core` and an installed Chromium browser, without adding runtime dependencies to the app:

```sh
npm install --prefix /tmp/zig-tigerbeetle-course-browser-qa --no-package-lock playwright-core
PLAYWRIGHT_MODULE=/tmp/zig-tigerbeetle-course-browser-qa/node_modules/playwright-core/index.mjs node scripts/check-ui.mjs
PLAYWRIGHT_MODULE=/tmp/zig-tigerbeetle-course-browser-qa/node_modules/playwright-core/index.mjs npm run test:vim
PLAYWRIGHT_MODULE=/tmp/zig-tigerbeetle-course-browser-qa/node_modules/playwright-core/index.mjs npm run test:display
```

Set `CHROMIUM_BIN` if Chromium is not at `/usr/bin/chromium`. The check uses disposable progress storage and covers desktop/mobile layouts, editing, reload persistence, real compiler results, quizzes, hints, the solution dialog, the playground, and absence of external requests. The Vim check covers Normal/Insert/Visual/block modes, motions, counts, operators, text objects, undo/redo, search, draft persistence, read-only tests, matching font sizes, compact command panels, and offline loading. The display check verifies independent font sizes, reload persistence, draft retention, regular/Vim editor alignment, reset controls, and layouts from 320 to 1440 pixels wide. Screenshots are written to `/tmp/zig-tigerbeetle-course-*.png`.

## Extend

The curriculum is plain data in `lib/course.mjs`, `lib/zig-theory-course.mjs`, `lib/zig-practice-course.mjs`, `lib/zig-tigerstyle-course.mjs`, and `lib/tigerbeetle-course.mjs`. Chapters carry a trackId. The foundations chapter helper inserts the matching theory lesson before its exercises (after the workshop introduction in chapter one). Add stable lesson IDs, explanation, assignment, starter, solution, checks, hints, and primary references. Zig harnesses import the student's `main.zig` as `learner`; requested declarations need `pub`. The other exercise engines are `tigerbeetle`, `source`, and `upstream`. Answer keys, reference solutions, private source-answer mappings, and lab verifier configuration are omitted from the initial browser payload. Grading happens on the server. Teach a builtin or syntax construct in the lesson body before using it in a starter or reference solution; hints and external links supplement that explanation. Keep validation scripts and course totals current as the curriculum changes.

The Vim editor source is `editor/vim-editor.js`; rebuild its checked-in browser asset after changing it:

```sh
npm ci --ignore-scripts
npm run build:editor
```

Dependencies are version-pinned in `package-lock.json` and used only to build the local browser bundle. The build also writes the bundled packages' license notices to `public/vendor/vim-editor.LICENSE.txt`. No CDN requests are made at runtime.

## Other local Zig learning resources

[Ziglings](https://codeberg.org/ziglings/exercises) teaches by repairing small programs with a local compiler. [Exercism's Zig track](https://exercism.org/tracks/zig) supports a local workflow, with its platform providing the online course/progress experience. [Zig's official learning page](https://ziglang.org/learn/) collects further resources. Zig TigerBeetle Course's lessons are original; this app is not affiliated with Boot.dev or Ziglings.

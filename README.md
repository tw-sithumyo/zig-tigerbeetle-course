# Zig Forge

A Boot.dev-inspired Zig and TigerBeetle learning app that runs on your own computer. Lessons, code editing, compilation, database labs, tests, quizzes, and progress all stay local. No account, API key, hosted runner, or subscription.

Two learning paths contain **84 units, 51 exercises, and 73 quiz questions**. Every exercise has an explanation, assignment, failing starter, checks, progressive hints, and a reference solution. This is a structured path toward project fluency: completion is evidence of practice, not a certification of mastery or production readiness.

| Path | Chapters | Theory | Exercises | Quizzes / questions |
| --- | --- | --- | --- | --- |
| Zig foundations | 10 | 3 lessons | 30 local Zig exercises | 10 / 32 |
| TigerBeetle project | 10 | 10 lessons | 11 live DB labs, 7 Zig models, 2 source investigations, 1 upstream build/test | 10 / 41 |

## Start

**Windows:** follow the [Windows setup guide](docs/WINDOWS.md). Use **WSL2 + Ubuntu for both complete paths**, including live TigerBeetle labs and the upstream Zig build. The guide also covers the native PowerShell route for Zig exercises, shell-specific commands, moving the project, and troubleshooting.

Use Node.js 22.13 or later. On Linux/macOS, `tar` with xz support is needed for compiler setup. For a new checkout:

```sh
git clone git@github.com:stmSi/zig-tigerbeetle-course.git
cd zig-tigerbeetle-course
npm run setup
npm run setup:tigerbeetle
npm start
```

If you are using the original local workspace, start it from its existing path:

```sh
cd /home/stm/my-projects/zig-forge
npm run setup
npm run setup:tigerbeetle
npm start
```

Open **http://localhost:3030** and select **Zig foundations** or **TigerBeetle project** in the sidebar. On this machine, both environments are already installed; `npm start` is enough. Open the TigerBeetle path directly at **http://localhost:3030/#course/tigerbeetle**. There are no application npm dependencies and no frontend build step. Setup can be skipped for the path you do not need.

`npm run setup` downloads **Zig 0.17.0** from ziglang.org, verifies the archive's SHA-256 against the official download index, and installs it in `.tools/zig-0.17.0/`. It does not change your system Zig or shell PATH. Setup needs internet access; normal operation does not. The Zig archive includes an offline language reference, available at `/reference`.

Linux and macOS x64/ARM64 have automatic setup. Native Windows x64/ARM64 Zig setup uses PowerShell archive extraction; Windows-specific behavior has not been verified here. You can instead extract the official Zig archive yourself and set `ZIG_BIN` to its executable. Compiler and course versions must match. Linux is the platform verified for this project; the Windows guide explains the WSL2 route and its verification limits.

`npm run setup:tigerbeetle` installs the official **TigerBeetle 0.17.9** release with a pinned SHA-256, clones its source at **cc1c06a924e49b11089c521b2209d34c92caaf18**, and runs that checkout's compiler download script to install **Zig 0.14.1** separately. It requires Git, `unzip`, `tar`, xz support, and curl or wget on Linux/macOS. WSL2 is the recommended Windows path for these labs. The source checkout retains its upstream license. The normal live/source/unit-test lab workflow works offline after setup; external documentation links and optional broader upstream suites may need internet access.

The two Zig versions are intentional: the foundations/model exercises use 0.17.0; the real upstream build uses TigerBeetle's required 0.14.1. Neither replaces a global compiler. A live lab temporarily needs roughly 1.1 GiB of disk for a formatted data file and the replica's startup memory (about 1.5 GiB reported by this development configuration). The data file is removed afterward.

```sh
# Optional overrides. Use an absolute executable path for ZIG_BIN.
PORT=3031 npm start
ZIG_BIN=/path/to/zig-0.17.0/zig npm start
ZIG_FORGE_DATA=/path/to/my/progress npm start
TIGERBEETLE_BIN=/path/to/tigerbeetle-0.17.9 npm start
```

## Learning

- Start with **Your local workshop** in Zig foundations, or **What your team is building** in the TigerBeetle path. You can pick any chapter; progress and resume positions are tracked separately while XP is shared. Existing Zig progress remains compatible.
- Edit `main.zig` and choose **Check solution** (Ctrl/Cmd+Enter). Actual local compiler/test output appears below the editor. Only successful course checks complete an exercise.
- The **Tests** tab shows the read-only course checks. **My tests** runs test blocks in your file without completing the exercise. **Build** compiles without executing. **Format** runs `zig fmt`.
- Hints reveal one at a time. Viewing a reference solution is recorded, and loading one still requires running the checks. Exercise checks support learning; they are not an anti-cheating system.
- Quiz results include explanations. All questions must be correct to complete a checkpoint. Retry freely. XP is awarded once: 100 per exercise, 75 per quiz, 25 per theory lesson.
- Use **Playground** for independent programs and test blocks. **Save file** downloads the source. Builds use a temporary directory, which is removed after each command. To keep a binary, download your source and run `zig build-exe main.zig` in your own directory.
- Drafts save automatically. **Export progress** downloads a JSON backup. Copy `.data/progress.json` back into the data directory with the server stopped to restore a backup; there is no in-app import.

## Course

| Chapter | Topics |
| --- | --- |
| First sparks | Local workflow, hello world, constants, variables, functions |
| Give data a shape | Integer conversion, arrays, slices and byte strings |
| Choose your path | If expressions, iteration, exhaustive switching |
| Model a small world | Struct methods, enums, tagged union payloads |
| Write honest contracts | Pointers, optionals, error unions |
| Own your memory | Defer, allocation, ownership, errdefer and failure testing |
| Think at compile time | Comptime array lengths, generic functions, algorithm tests |
| Build: a tiny ledger | Strict parsing, multi-line input, report aggregation |
| Write in TigerStyle | Naming, units, options structs, external validation versus internal assertions, bounded work, overflow |
| Read TigerBeetle's Zig | Packed flags, type factories, `@This`, bounded queues, function pointers, `@fieldParentPtr`, ABI/comptime/platform patterns |

The last two chapters are **inside the Zig learning path**, with six additional coding exercises and eight quiz questions. They use source excerpts from the pinned TigerBeetle project and source-inspired examples. Tests verify behavior; `zig fmt` and passing tests do not replace a TigerStyle design review.

## TigerBeetle project path

| Chapter | Theory and practice |
| --- | --- |
| Meet TigerBeetle | Database/application responsibilities, real account creation, first transfer |
| Model accounts and assets | Debit/credit conventions, integer scale, u128 balance model, separate ledgers |
| Submit safely, batch deliberately | Persisted IDs, ambiguity, exact retries, dense 0.17 results, linked rollback |
| Enforce the invariant | Atomic balance policies, overdraft rejection, pending availability |
| Reserve, settle, or release | Pending, partial posting, voiding, expiry semantics and immutable resolution records |
| Read and reconcile | Real transfer/balance history queries, pagination, overflow-safe reconciliation model |
| Build a reliable wallet flow | Holds, fees, linked-batch retry inspection, correcting transfers, SDK integration design |
| Find your way around the source | Actual module/handler discovery, ABI layout, allocation and callback ownership |
| Order, replicate, recover | Normal VSR path, different replication/view-change thresholds, WAL/LSM/checkpoints |
| Test, recover, contribute | Bounded replay, actual kill/restart persistence, real upstream unit test, VOPR, review and operations |

Live exercises edit **commands.tb**, a semicolon-delimited TigerBeetle REPL script. Each Run/Check creates its own empty development replica, applies the documented fixture, executes commands individually, and removes the entire database. **Run commands** displays responses; only **Check solution** verifies state and awards completion. No existing cluster, production data file, or remote endpoint is used. Business rejections such as `exceeds_credits` can be the expected result of a successful lesson. The capstone also demonstrates that a repeated linked batch can report `exists` for one member and `linked_event_failed` for others; it requires looking up and comparing the original payloads.

Source investigations edit **evidence.json** and check answers against actual local source declarations. Source buttons display allowlisted local excerpts with line numbers and pinned upstream links. The **upstream build/test** exercise invokes the checkout's real `./zig/zig build test:unit --summary all -- sum_overflows`, requires successful test execution, and uses its own Zig 0.14.1. It does not accept arbitrary shell commands. Cold builds can take several minutes. The course uses a bounded focused test; it does not claim that this is the full upstream test suite.

The seven TigerBeetle Zig model exercises are explicitly labeled teaching models. They do not implement the production accounting state machine or VSR. The real database labs are separate from these models. The final review asks for an SDK implementation of the wallet flow, a source trace, a meaningful new boundary test in a separate working clone, and an operational recovery discussion with your team.

## Execution and storage

The server binds to `127.0.0.1` and accepts only localhost hosts and same-origin requests. Mutations require a random per-server session token. It serves public assets, the language reference, and specific allowlisted source excerpts; arbitrary source paths, progress files, and toolchain files are not directly served. This is a personal local tool, not a multi-user server.

On Linux, if Bubblewrap (`bwrap`) is installed and user namespaces are permitted, compiler jobs run with network, process, and filesystem namespaces. Only system runtime directories, the read-only Zig toolchain, the job workspace, and compiler cache are mounted. Your home directory is not mounted. On this machine Bubblewrap is available and enabled. On other platforms, or when Bubblewrap cannot run, execution falls back to native processes with your user permissions; the Environment dialog shows the active mode. `ZIG_FORGE_SANDBOX=off` explicitly selects native execution. Native mode is for your own code and trusted examples.

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
npm run test:tigerbeetle
```

The tests cover real compilation/database operations, durable drafts, one-time XP, quiz grading, separate resume positions, local-request guards, source-excerpt allowlists, formatting, building, compiler failures, and output limits. Environment-dependent tests skip when the relevant tool is not installed. `test:course` checks all **37 Zig reference solutions and starters** across both paths. `test:tigerbeetle` checks all **14 live/source/upstream reference solutions and starters**, including linked rollback/retry, allocation-independent account policies, real restart persistence, and the actual upstream test.

An optional browser check lives in `scripts/check-ui.mjs`. It requires `playwright-core` and an installed Chromium browser, without adding runtime dependencies to the app:

```sh
npm install --prefix /tmp/zig-forge-browser-qa --no-package-lock playwright-core
PLAYWRIGHT_MODULE=/tmp/zig-forge-browser-qa/node_modules/playwright-core/index.mjs node scripts/check-ui.mjs
```

Set `CHROMIUM_BIN` if Chromium is not at `/usr/bin/chromium`. The check uses disposable progress storage and covers desktop/mobile layouts, editing, reload persistence, real compiler results, quizzes, hints, the solution dialog, the playground, and absence of external requests. Screenshots are written to `/tmp/zig-forge-*.png`.

## Extend

The curriculum is plain data in `lib/course.mjs`, `lib/zig-tigerstyle-course.mjs`, and `lib/tigerbeetle-course.mjs`. Chapters carry a trackId. Add stable lesson IDs, explanation, assignment, starter, solution, checks, and hints. Zig harnesses import the student's `main.zig` as `learner`; requested declarations need `pub`. The other exercise engines are `tigerbeetle`, `source`, and `upstream`. Answer keys, reference solutions, private source-answer mappings, and lab verifier configuration are omitted from the initial browser payload. Grading happens on the server. Keep validation scripts and course totals current as the curriculum changes.

## Other local Zig learning resources

[Ziglings](https://codeberg.org/ziglings/exercises) teaches by repairing small programs with a local compiler. [Exercism's Zig track](https://exercism.org/tracks/zig) supports a local workflow, with its platform providing the online course/progress experience. [Zig's official learning page](https://ziglang.org/learn/) collects further resources. Zig Forge's lessons are original; this app is not affiliated with Boot.dev or Ziglings.

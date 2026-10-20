# Zig TigerBeetle Course

Learn Zig and TigerBeetle locally through lessons, coding exercises, quizzes, and real database labs. Works offline after setup.

**102 units · 59 exercises · 73 quiz questions**

- **Zig foundations:** language basics, memory, comptime, TigerStyle, and a small ledger project.
- **TigerBeetle:** accounts, transfers, retries, pending payments, queries, and source exploration.
- Local compiler feedback, hints, solutions, saved progress, and an optional Vim editor.
- Separate font-size controls for code, course text, and navigation under **Aa Display**.

## Quick start

Requires **Node.js 22.13+**, Git, curl or wget, unzip, and tar with xz support. Windows users: see the [WSL2 setup guide](docs/WINDOWS.md).

```sh
git clone https://github.com/tw-sithumyo/zig-tigerbeetle-course.git
cd zig-tigerbeetle-course
npm run setup
npm run setup:tigerbeetle
npm start
```

Open **http://localhost:3030**. Skip `setup:tigerbeetle` if you only want Zig foundations. After setup, just run `npm start`.

Toolchains install under `.tools/`; progress lives in `.data/progress.json`. Use **Export progress** to back up your work. No account or API key needed.

## Development

```sh
npm test
npm run test:course
npm run test:tigerbeetle
```

To rebuild the bundled editor: `npm ci --ignore-scripts && npm run build:editor`.

[Third-party notices](THIRD_PARTY_NOTICES.md)

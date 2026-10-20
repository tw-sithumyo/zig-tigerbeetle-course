# Third-party material

TigerBeetle is an independent project. This app is not affiliated with TigerBeetle or Boot.dev.

The original learning material references TigerBeetle release 0.17.9 at commit `cc1c06a924e49b11089c521b2209d34c92caaf18`. The source-inspection feature reads excerpts from the locally installed upstream repository. TigerBeetle source is licensed under Apache License 2.0; the checkout retains its LICENSE and source notices. See [the upstream license](https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/LICENSE).

The pinned source/compiler and official release binary are installed separately in the ignored `.tools` directory. Zig toolchain distributions retain their own license files. Course code models are identified as educational examples; they are not substitutes for or claims about a complete production implementation.

## Browser Vim editor

The optional editor bundles [CodeMirror 6](https://codemirror.net/) and [@replit/codemirror-vim](https://github.com/replit/codemirror-vim), together with their browser dependencies. The bundled packages use the MIT license. Full package/version and copyright notices are retained in [vim-editor.LICENSE.txt](public/vendor/vim-editor.LICENSE.txt), generated from the installed packages by `npm run build:editor`. Exact dependency versions and integrity hashes are recorded in `package-lock.json`.

# Run Zig TigerBeetle Course locally on Windows

Use **WSL2 with Ubuntu** for the complete Zig and TigerBeetle experience. The app, compilers, database replicas, and tests run on your own Windows computer inside WSL2; you use your normal Windows browser at **http://localhost:3030**. Nothing is deployed to a remote server.

| Feature | WSL2 + Ubuntu | Native Windows + PowerShell |
| --- | --- | --- |
| Lessons, quizzes, saved progress | Available | Available |
| Zig exercises, TigerStyle exercises, playground | Uses the Linux Zig compiler | Intended to work with the Windows Zig compiler |
| TigerBeetle Zig model exercises | Available | Intended to work with the Windows Zig compiler |
| Live TigerBeetle database labs | Linux installer and runner | Native setup is not implemented in this app |
| Pinned source excerpts/investigations | Installed by TigerBeetle setup | Not installed by the native setup |
| Real upstream TigerBeetle build/test | Separate upstream Linux compiler | Native setup is not implemented in this app |
| Bubblewrap isolation | Used when supported; otherwise native WSL processes | Unavailable; programs use your Windows account permissions |

The Linux application and both course environments have been tested. **These Windows/WSL2 instructions have been checked against the installers and official platform documentation, but have not been executed on a Windows machine.** TigerBeetle itself provides Windows development binaries; the native limitation above is in Zig TigerBeetle Course's current installer and lab setup.

## Full setup: WSL2 + Ubuntu

### 1. Install or check WSL2 — Windows PowerShell

On Windows 11, or Windows 10 version 2004/build 19041 or newer, open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Restart Windows if prompted. Launch **Ubuntu** from the Start menu and create the Linux username/password it requests.

If WSL is already installed, check it in PowerShell:

```powershell
wsl --list --verbose
```

The Ubuntu entry should show **VERSION 2**. If it shows 1, convert that distribution:

```powershell
wsl --set-version Ubuntu 2
```

Use the actual distribution name from the list if it differs from `Ubuntu`. See [Microsoft's WSL installation instructions](https://learn.microsoft.com/en-us/windows/wsl/install) for prerequisites and installation failures. Corporate-managed computers may require your IT team's help enabling WSL/virtualization.

### 2. Install Linux dependencies — Ubuntu terminal

Run the following **inside Ubuntu**, not in PowerShell:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates unzip xz-utils tar bubblewrap rsync
```

Install **Linux Node.js 24 LTS** using nvm. Windows Node.js is a separate installation and should not be used for the WSL workflow. The pinned nvm installer below comes from the official nvm project:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh -o /tmp/zig-tigerbeetle-course-nvm-install.sh
bash /tmp/zig-tigerbeetle-course-nvm-install.sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
```

If you already use nvm in Ubuntu, only the last two commands are needed. Verify:

```bash
node --version
npm --version
node -p "process.platform"
```

The platform must print **linux** and Node must be **22.13 or newer**. The project does not require `npm install` because it has no application npm dependencies. Microsoft also documents [Node.js setup in WSL2](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl); nvm documents its [installation process](https://github.com/nvm-sh/nvm/tree/v0.40.8#installing-and-updating).

### 3. Move the project into Ubuntu

The simplest option is to clone the published repository directly inside Ubuntu:

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/tw-sithumyo/zig-tigerbeetle-course.git zig-tigerbeetle-course
cd zig-tigerbeetle-course
```

Then continue with step 4. This public HTTPS clone does not need a GitHub login. If you prefer to transfer an existing local copy, use the following alternative.

Copy this project's source folder to **C:\Projects\zig-tigerbeetle-course** on Windows. This means the `zig-tigerbeetle-course` folder containing `package.json`, `server.mjs`, `public`, `lib`, `scripts`, and `docs`—the `/home/stm/...` path from the main README belongs to the original Linux machine and is not a Windows path.

Then, in Ubuntu, copy the source into its Linux filesystem:

```bash
mkdir -p ~/projects/zig-tigerbeetle-course
rsync -a --exclude='.tools/' --exclude='.data/' --exclude='node_modules/' --exclude='.git/' /mnt/c/Projects/zig-tigerbeetle-course/ ~/projects/zig-tigerbeetle-course/
cd ~/projects/zig-tigerbeetle-course
```

Adjust `/mnt/c/Projects/zig-tigerbeetle-course/` if you put the Windows copy elsewhere. Keep the working copy, compiler caches, and TigerBeetle data files under `~/projects/zig-tigerbeetle-course`, rather than running the database/build from `/mnt/c`. This follows [Microsoft's guidance to keep Linux Node projects in the Linux filesystem](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl).

Toolchains and caches should be installed again for the target OS/architecture. **Do not copy `.tools` or build/database caches from another machine into this installation.** If you want your old progress, copy only its `.data/progress.json` separately as explained below.

### 4. Install both environments and start — Ubuntu terminal

```bash
cd ~/projects/zig-tigerbeetle-course
npm run setup
npm run setup:tigerbeetle
npm start
```

The first setup installs course Zig **0.17.0**. The second installs TigerBeetle **0.17.9**, the pinned source checkout, and its separate Zig **0.14.1**. Setup downloads files and needs internet access; normal course/lab operation works offline afterward. Allow a few GiB of free disk space and enough memory for a local replica; each live lab temporarily creates a data file of about 1.1 GiB.

Keep that terminal running. Open one of these addresses in your **Windows browser**:

- Both paths: **http://localhost:3030**
- TigerBeetle directly: **http://localhost:3030/#course/tigerbeetle**

WSL supports accessing Linux web servers from Windows through localhost; no public bind address or LAN port-forwarding setup is needed for this app. See [Microsoft's WSL networking documentation](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-linux-networking-apps-from-windows-localhost).

In the app's **Environment** dialog, check for course Zig 0.17.0, TigerBeetle 0.17.9, the pinned source commit, and upstream Zig 0.14.1. Bubblewrap is used if this WSL installation permits the required namespaces. A displayed `Native process` mode means jobs run as your Linux user inside WSL.

### 5. Start again later

Open Ubuntu and run:

```bash
cd ~/projects/zig-tigerbeetle-course
nvm use 24
npm start
```

Stop the app with **Ctrl+C**. You do not need to repeat the setup commands for each session. If you selected another Node installation method, skip `nvm use 24` and use your installed Linux Node version.

To run the project's checks, stop the app and run in Ubuntu:

```bash
npm test
npm run test:course
npm run test:tigerbeetle
```

The TigerBeetle checks use real disposable replicas and a real upstream test build. A cold upstream build can take several minutes.

## Native Windows: Zig exercises in PowerShell

This route covers the web interface, quizzes, Zig/TigerStyle exercises, and Zig playground. **Use WSL2 for the complete TigerBeetle path.** The native Zig setup has not been executed on Windows during this project's verification.

1. Install the Windows **Node.js LTS** installer for your architecture from [nodejs.org](https://nodejs.org/en/download). Use Node 22.13 or newer. Close and reopen PowerShell after installation.
2. Copy the project source into **C:\Projects\zig-tigerbeetle-course**, without copying `.tools`, compiler caches, or disposable database files from Linux/macOS. Alternatively, with Git for Windows installed, run `git clone https://github.com/tw-sithumyo/zig-tigerbeetle-course.git C:\Projects\zig-tigerbeetle-course` in PowerShell.
3. In a normal PowerShell window, run:

```powershell
Set-Location C:\Projects\zig-tigerbeetle-course
node --version
node -p "process.platform"
npm.cmd run setup
npm.cmd start
```

The platform should print **win32**. `npm.cmd` explicitly selects npm's Windows command wrapper, avoiding PowerShell execution-policy errors from `npm.ps1`; changing your system execution policy is unnecessary. The Zig installer downloads the Windows archive, verifies its checksum, and extracts it using PowerShell. Paths are passed as literal environment values, including paths containing spaces.

Open **http://localhost:3030**. Native execution has no Bubblewrap isolation. The native `setup:tigerbeetle` command stops with a WSL2 instruction; setting `TIGERBEETLE_BIN` alone would not install the source and upstream compiler needed for all project labs.

If automatic Zig extraction fails, manually download/extract **Zig 0.17.0 for Windows** from [the official release downloads](https://ziglang.org/download/0.17.0/release-notes.html). Then, in the same PowerShell window:

```powershell
$env:ZIG_BIN = 'C:\Tools\zig-0.17.0\zig.exe'
& $env:ZIG_BIN version
npm.cmd start
```

Replace that path with your actual executable. It must print `0.17.0`. For subsequent sessions, set `ZIG_BIN` again before starting. These are process-local environment variables, not permanent system PATH changes.

### Optional environment variables: use the right shell

In PowerShell:

```powershell
$env:PORT = '3031'
npm.cmd start
```

In Ubuntu Bash:

```bash
PORT=3031 npm start
```

Then open **http://localhost:3031**. Use a port not occupied by a Windows or WSL process. The Bash form `PORT=3031 npm start` does not work directly in PowerShell.

## Progress and backups

The working installation saves code and progress in `.data/progress.json` under its project folder. For WSL, that is `~/projects/zig-tigerbeetle-course/.data/progress.json`. **Export progress** in the app saves a JSON backup through your Windows browser.

To move existing progress, stop the destination app, create its `.data` directory if necessary, and copy your old `progress.json` or exported `zig-tigerbeetle-course-progress.json` there as **progress.json**. Back up an existing destination file before replacing it. Start the app again. The progress file is portable across platforms; compiled tools and caches are not. Do not run two app servers against the same progress file.

You can open the WSL project in Windows File Explorer from Ubuntu with:

```bash
cd ~/projects/zig-tigerbeetle-course
explorer.exe .
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `npm.ps1 cannot be loaded` | In PowerShell, use `npm.cmd`. In Ubuntu, use Linux npm. |
| Ubuntu reports `process.platform` as `win32` | Your shell found Windows Node. Load nvm with `. "$HOME/.nvm/nvm.sh"`, then `nvm use 24`; confirm the platform is `linux`. |
| `node` is too old | Use Node 22.13 or newer; `nvm install 24` inside Ubuntu selects a compatible major. |
| Native TigerBeetle setup says unsupported platform | Run both setup commands and the server inside WSL2 Ubuntu. A manually supplied Windows TigerBeetle binary does not provide the whole environment. |
| `Exec format error`, missing `zig.exe`, or an incomplete toolchain after copying | You copied a toolchain for another platform. Preserve progress, remove only the affected `.tools/zig-0.17.0` directory, and rerun setup in the intended environment. |
| `unzip`, `xz`, `curl`, or Git is missing | Run the Ubuntu dependency-install command above. |
| A live lab cannot create its data file | Check free disk/memory and run the working copy under Ubuntu's home directory, not `/mnt/c`; stop the app before cleaning leftover `.data/tigerbeetle-work` files. |
| Old WSL/kernel or an `io_uring` error | In PowerShell, run `wsl --update`, verify Ubuntu uses WSL2, then restart Ubuntu and retry. |
| Browser cannot reach the app | Keep `npm start` running; check `curl -I http://localhost:3030` inside Ubuntu, confirm the printed port, then try `http://127.0.0.1:3030` in Windows. Review the Microsoft networking guide if VPN or company policy affects localhost forwarding. |
| Port 3030 is busy | Use the appropriate `PORT` command above and open the new localhost URL. |
| `Native process` appears in WSL | Namespace isolation is unavailable in that WSL configuration; the app automatically falls back to your local Linux user permissions. |

Changing the server to a public/LAN address is not required for this local workflow. The app intentionally accepts localhost requests only.

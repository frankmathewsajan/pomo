# POMO 🍅

A hyper-minimal, feature-rich Pomodoro timer for Windows. Built with **Tauri v2 + React + Tailwind CSS**.

## ✨ Features

### 🎨 5 Paradigm Themes
One button rotates through five completely distinct UI design systems — all light-mode:
| # | Paradigm | Signature |
|---|----------|-----------|
| 1 | **Brutalist** | Black borders, offset shadows, mono font |
| 2 | **Material 3** | Rounded cards, soft shadows, purple accent |
| 3 | **shadcn** | Clean grays, minimal borders, Inter font |
| 4 | **Fluent** | Frosted glass, blur effects, Segoe UI |
| 5 | **Neumorph** | Soft extruded/indented surfaces, dual shadows |

### ⏱️ Time Blocks
Select the pace that fits your workflow:
| Block | Focus | Break | Use Case |
|-------|-------|-------|----------|
| **Mini** | 10 min | 2 min | Quick tasks |
| **Normal** | 25 min | 5 min | Medium work |
| **Deep** | 50 min | 10 min | Deep focus |

### 📝 Task Naming & History
Name your current task before starting. Completed or aborted focus sessions auto-save to a collapsible **Activity & History** sidebar. You can filter the history by `All`, `Done`, `Early`, or securely pick a specific date. Last 50 entries are persisted.

### 📋 Interactive Task Queue
Plan your day using the **Up Next** queue sidebar:
- **Add Blocks:** Quickly line up tasks as Mini, Normal, or Deep blocks.
- **Schedule Time:** Set a specific time for a task to begin.
- **Recurring Tasks:** Mark tasks as recurring. They stay hidden from your active list when regular tasks are pending, and execute as a fallback!
- **Manage & Edit:** Re-order tasks with up/down arrows, rename tasks inline by clicking them, or delete them.

### 🗄️ JSON Config Syncing
Easily Backup or Restore your active state and history across devices using the **Sync Menu** (bottom left). Export your config as a JSON file, or import an existing configuration file.

### 🧠 Persistent State
Timer progress, active theme, block type, queued tasks, and history survive app restarts seamlessly via `localStorage`.

---

## 📥 Download & Installation

### Option 1: Download from Releases (Ready-to-use)
1. Go to the **Releases** section of this repository.
2. Download the latest Windows installer (`.msi` or `.exe`).
3. Run the installer to install POMO on your Windows machine.

### Option 2: Build from Source (For Developers)
If you prefer to build the App yourself or run it in development mode:

**Prerequisites:**
- Node.js installed
- Rust toolchain installed (for Tauri)

**1. Clone & Install dependencies:**
```bash
npm install
```

**2. Run in Development Mode:**
```bash
npm run tauri dev
```

**3. Build the Windows Executable:**
```bash
npm run tauri build
```
Once built, the installer will be available in the `src-tauri/target/release/bundle/` directory.

---

## 🏗️ Architecture Stack

- **Tauri v2:** Ultra-lightweight native Windows app shell.
- **React 19:** View rendering.
- **Tailwind v4:** Styling and Paradigm Themes.
- **Zero external state libraries:** `ctx.tsx` handles pure React Context for timer logic, theme, and persistence.

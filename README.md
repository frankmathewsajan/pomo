# pomo

A hyper-minimal Pomodoro timer for Windows. Built with **Tauri v2 + React + Tailwind CSS**.

## ✨ 5 Paradigm Themes

One button rotates through five completely distinct UI design systems — all light-mode:

| # | Paradigm | Signature |
|---|----------|-----------|
| 1 | **Brutalist** | Black borders, offset shadows, mono font |
| 2 | **Material 3** | Rounded cards, soft shadows, purple accent |
| 3 | **shadcn** | Clean grays, minimal borders, Inter font |
| 4 | **Fluent** | Frosted glass, blur effects, Segoe UI |
| 5 | **Neumorph** | Soft extruded/indented surfaces, dual shadows |

## ⏱️ Time Blocks

| Block | Focus | Break | Use Case |
|-------|-------|-------|----------|
| **Mini** | 10 min | 2 min | Quick tasks |
| **Normal** | 25 min | 5 min | Medium work |
| **Deep** | 50 min | 10 min | Deep focus |

## 📝 Task Naming & History

Name your current task before starting. Completed focus sessions auto-save to a collapsible history log (persisted, last 50 entries).

## 🧠 Persistent State

Timer progress, active theme, block type, task name, and work/break mode survive app restarts via `localStorage`.

## 🏗️ Architecture

```
src/
├── main.tsx        # React entry (3 lines)
├── App.tsx         # Custom titlebar + layout + history
├── Timer.tsx       # SVG ring + block tabs + task input
├── ctx.tsx         # Context: timer + theme + history + persistence
├── themes.ts       # 5 theme CSS-variable maps
└── index.css       # Tailwind v4 + paradigm overrides
```

**6 files. ~200 lines of TypeScript. Zero external state libraries.**

## 🚀 Dev

```bash
npm install
npm run tauri dev
```

## 📦 Build

```bash
npm run tauri build
```

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

## 🧠 Persistent State

Timer progress, active theme, and work/break mode survive app restarts via `localStorage`.

## 🏗️ Architecture

```
src/
├── main.tsx        # React entry (3 lines)
├── App.tsx         # Custom titlebar + layout
├── Timer.tsx       # SVG ring + MM:SS + controls
├── ctx.tsx         # Context: timer + theme + persistence
├── themes.ts       # 5 theme CSS-variable maps
└── index.css       # Tailwind v4 + paradigm overrides
```

**6 files. ~150 lines of TypeScript. Zero external state libraries.**

## 🚀 Dev

```bash
npm install
npm run tauri dev
```

## 📦 Build

```bash
npm run tauri build
```

# POMO

POMO is a desktop-first Pomodoro app built with Tauri v2, React 19, Vite, and Tailwind v4.
It is optimized for fast task switching, queue-driven work selection, and local-first persistence.

## Core Features

### Focus presets

| Block | Focus | Break |
| --- | --- | --- |
| Mini | 10 min | 2 min |
| Normal | 25 min | 5 min |
| Deep | 50 min | 10 min |

### Productivity workflow

- Queue-first planning with archive and trash restore.
- Recurring templates (daily, alternate, weekdays, holidays, weekly custom days).
- Scheduled idle tasks with due-time-aware queue resolution.
- Manual pick and roulette pick when work input is empty.
- Wait-mode micro-task handling for blocked work.

### Notes and metadata

- Per-task notes with optional rich HTML editing.
- Per-task tags and global reusable tags.
- Activity history grouped by contiguous identical entries.
- History filters by status and date.

### Feedback and notifications

- Local start cue sounds.
- 90% and 100% progress notifications.
- Optional global shortcut to toggle timer flow.

## Persistence and Native I/O (Tauri v2)

POMO no longer relies on direct `localStorage` as its primary persistence layer.

### Store plugin

- Persistence is handled through `@tauri-apps/plugin-store` (`LazyStore`).
- Frontend state is saved under:
	- `state`
	- `history`
- Save path is `pomo-state.json` in the app data scope managed by Tauri.
- Context initialization is async and gated so state is loaded before main UI renders.

### Import and export

- Export uses native file save dialog (`@tauri-apps/plugin-dialog`).
- Import uses native open dialog + filesystem read (`@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs`).
- Payload format:

```json
{
	"state": { "...": "app state" },
	"history": [{ "...": "entry" }]
}
```

### Global shortcut

- Shortcut: `CommandOrControl+Alt+Shift+P`
- Registered/unregistered from React lifecycle in the desktop shell.
- Triggers timer `toggle` action.

## Rust Plugin Wiring

The Rust app entrypoint wires Tauri plugins in a v2-style builder chain.

Enabled plugins include:

- `tauri_plugin_single_instance`
- `tauri_plugin_window_state`
- `tauri_plugin_global_shortcut`
- `tauri_plugin_store`
- `tauri_plugin_dialog`
- `tauri_plugin_fs`
- `tauri_plugin_notification`
- `tauri_plugin_opener`

Single-instance behavior focuses the existing `main` window when a second launch is attempted.

## Project Structure

### Frontend

- `src/context/AppContext.tsx`: app state and main actions (timer, queue, persistence, import/export).
- `src/layouts/Chrome.tsx`: desktop frame, sidebars, shortcut lifecycle.
- `src/components/Timer.tsx`: timer composition root.
- `src/components/timer/*`: clock, controls, notes, wait setup.
- `src/components/queue/*`: queue atoms (item, add form, trash list).
- `src/hooks/useQueueScheduler.ts`: queue scheduling behavior.
- `src/hooks/useTimerNotifications.ts`: notification orchestration.
- `src/utils/queueTime.ts`: due-time and fixed-target helpers.

### Tauri shell

- `src-tauri/src/lib.rs`: plugin registration and runtime behavior.
- `src-tauri/tauri.conf.json`: app metadata and build wiring.
- `src-tauri/capabilities/default.json`: plugin and API capabilities.

## Development

### Prerequisites

- Bun
- Rust toolchain
- Tauri desktop prerequisites for your OS

### Install

```bash
bun install
```

### Run desktop dev mode

```bash
bun run tauri dev
```

### Quality checks

```bash
bun run tsc --noEmit
bun run test
```

### Build release

```bash
bun run tauri build
```

Output bundles are generated under `src-tauri/target/release/bundle/`.

## Runtime Notes

- In true Tauri runtime, plugin-backed persistence and shortcut features are active.
- In non-Tauri environments (for example, unit tests), plugin calls are guarded to avoid runtime invoke errors.
- State import still updates in-memory app state immediately; plugin persistence is only attempted when Tauri invoke is available.

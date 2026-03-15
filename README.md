# POMO

POMO is a desktop Pomodoro app built with Tauri v2, React 19, Vite, and Tailwind v4. It stays small, keeps state local, and focuses on rapid task switching instead of heavyweight project management.

## What it does

POMO ships with three focus presets:

| Block | Focus | Break |
| --- | --- | --- |
| Mini | 10 min | 2 min |
| Normal | 25 min | 5 min |
| Deep | 50 min | 10 min |

It also includes:

- Five switchable visual themes.
- Persistent task, notes, queue, history, and theme state via localStorage.
- Activity history with status and date filtering.
- Queue scheduling, recurring tasks, archive, and trash recovery.
- Manual queue picking when the current task field is empty.
- Roulette queue picking that skips future scheduled tasks and weights older tasks more heavily.
- Wait-mode micro-task handling for blocked work.
- Export and import of saved state as JSON.
- 90% and 100% timer notifications with local audio cues.

## Run it

Prerequisites:

- Bun
- Rust toolchain
- Tauri desktop prerequisites for your OS

Install dependencies:

```bash
bun install
```

Run the app in development:

```bash
bun run tauri dev
```

Run type-checking:

```bash
bun run tsc --noEmit
```

Run tests:

```bash
bun run test
```

Build a release bundle:

```bash
bun run tauri build
```

Artifacts are written under `src-tauri/target/release/bundle/`.

## Architecture

The frontend is split by role instead of keeping everything flat under `src/`:

- `src/components` contains view atoms, sidebars, timer pieces, and queue-specific UI.
- `src/context/AppContext.tsx` owns durable app state and queue and timer actions.
- `src/hooks` contains high-frequency or compute-heavy logic such as timer notifications and queue scheduling.
- `src/utils` contains theme data, sound helpers, and queue-time utilities shared across the app.
- `src/layouts/Chrome.tsx` owns the desktop shell layout.
- `src/types/index.ts` holds shared domain types.

The 100ms timer tick is no longer global state. It lives inside the clock face so the rest of the app does not rerender at timer frequency.

The queue scheduler is isolated from the sidebar UI, which keeps scheduling math out of render code and makes the sidebar easier to maintain.

On the Tauri side, the project follows the standard v2 split: the web frontend stays at the repository root, while the Rust app shell lives in `src-tauri/` with `tauri.conf.json`, capabilities, icons, and Rust entrypoints.

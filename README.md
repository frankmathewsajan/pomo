# POMO

POMO is a desktop-first, queue-driven focus system built with Tauri v2, React 19, Vite, and Tailwind v4.
It is designed to help you maintain execution speed without context chaos: short admin sprints, standard flow cycles, and biologically aligned deep-work blocks.

**Default Block Model (Science-First Design)**

| Block | Focus | Break | Purpose |
| --- | --- | --- | --- |
| Mini | 15 min | 0 min | Admin clearing, low-cognitive-overhead batching |
| Normal | 25 min | 5 min | Standard single-task execution |
| Deep | 52 min | 17 min | High-intensity deep work aligned to ultradian rhythms |

1. The 15-minute Mini block: Parkinson's Law and task batching.
- Rationale: short administrative work (email, scheduling, triage, cleanup) has high startup friction but low intrinsic complexity.
- Science: Parkinson's Law suggests work expands to fill available time. A hard 15-minute boundary compresses execution and limits cognitive diffusion.
- Mechanism in POMO: this block intentionally uses 0 break minutes because cognitive depletion is minimal for this class of tasks; the app preserves kinetic momentum for rapid batch completion.

2. The 25/5 Normal block: attention residue mitigation.
- Rationale: 25 minutes remains an effective focus span for most operational and analytical tasks.
- Science: Sophie Leroy's attention residue model shows that switching tasks without a clean boundary leaves residual attention attached to the previous task, degrading performance on the next one.
- Mechanism in POMO: the 5-minute break is a forced pattern interrupt. It is not decorative rest; it is a cognitive disengagement window so the next queue item gets full executive bandwidth.

3. The 52/17 Deep block: ultradian rhythm alignment.
- Rationale: deep knowledge work is biologically constrained, not just timeboxed by preference.
- Science: Kleitman's Basic Rest-Activity Cycle (BRAC) and subsequent productivity observations indicate repeating peaks/troughs in waking alertness. A 52/17 cadence closely matches empirically observed high-output behavior.
- Mechanism in POMO: Deep mode enforces long uninterrupted focus and a substantial break to preserve quality over long sessions, not just quantity of elapsed minutes.

4. Mandatory break design: Default Mode Network activation.
- Rationale: post-focus breaks are a computational phase shift, not wasted time.
- Science: when task-positive networks downshift and the Default Mode Network (DMN) activates during wakeful rest, memory integration and cross-domain synthesis improve.
- Mechanism in POMO: for blocks with defined breaks, the app steers users through break completion to reduce burnout and improve downstream problem solving.

**References**
- Leroy, S. (2009). Why is it so hard to do my work? The challenge of attention residue when switching between work tasks. Organizational Behavior and Human Decision Processes, 109(2), 168-181.
- Kleitman, N. (1982). Basic rest-activity cycle-22 years later. Sleep, 5(4), 311-317.
- Draugiem Group / DeskTime analysis (2014). The Rule of 52 and 17.
- Raichle, M. E., et al. (2001). A default mode of brain function. Proceedings of the National Academy of Sciences, 98(2), 676-682.

**Queue Mechanism (How Work Actually Flows)**

- Queue-first execution: tasks are selected from queue before free-typing when possible.
- Manual selection and roulette: you can pick directly or let roulette choose when decision fatigue is high.
- Active queue item binding: when a timer starts from queue, the app keeps the source link so reset and state transitions can restore queue integrity.
- Reset and return: resetting a queue-sourced run can place that item back at the front so interrupted work is not lost.
- Wait mode support: blocked work can be parked with a wait reason and resumed without deleting context.
- Due-time awareness: scheduler logic can prioritize by timing context, not only insertion order.

**Archive, Trash, and Recurring Schedules**

- Archive flow: temporarily remove tasks from active execution without deleting historical intent.
- Trash flow: deleted tasks are recoverable through restore paths, reducing accidental permanent loss.
- Recurring templates: supports daily, alternate-day, weekday/holiday style patterns, plus weekly custom day selection.
- Recurring + queue: recurring definitions seed future queue entries while preserving current active list clarity.

**Activity History and Post-Run Hygiene**

- Contiguous grouping: repeated consecutive entries are grouped to reduce log noise.
- Status/date filtering: quickly isolate deep work, completed blocks, or specific day windows.
- Per-entry hide: completed items can be individually hidden to keep review panes focused.

**Notes, Tags, and Metadata**

- Per-task notes with optional rich HTML mode.
- Per-task tags and reusable global tags.
- Quick notes and prompt context can ride along with queue-picked tasks.

**Notifications and UX Feedback**

- Local start sounds.
- Progress cues at key milestones (for example 90% and completion).
- Optional global shortcut toggling timer flow: `CommandOrControl+Alt+Shift+P`.

**Persistence and Native I/O (Tauri v2)**

- Primary persistence uses `@tauri-apps/plugin-store` (`LazyStore`), not direct browser-only storage semantics.
- State payload includes both app state and activity history.
- Import/export uses native dialogs and filesystem capabilities via Tauri plugins.
- Typical data container shape:

```json
{
  "state": { "...": "app state" },
  "history": [{ "...": "entry" }]
}
```

**Native Runtime Wiring**

- Tauri plugins include: single instance, window state, global shortcut, store, dialog, filesystem, notification, opener.
- Single-instance behavior focuses the existing `main` window when a second launch is attempted.
- In non-Tauri test environments, plugin invocations are guarded so tests do not fail on missing native runtime.

**Project Map**

- `src/context/AppContext.tsx`: timer state machine, queue/actions, persistence wiring.
- `src/components/SyncMenu.tsx`: settings entry, toggles, import/export, global tags.
- `src/components/ActivitySidebar.tsx`: grouped history, filters, per-entry hide.
- `src/components/queue/*`: add/edit/archive/delete/restore queue interactions.
- `src/components/timer/*`: clock, controls, notes, wait setup.
- `src/hooks/useQueueScheduler.ts`: scheduling and due-time logic.
- `src/hooks/useTimerNotifications.ts`: focus/break notification orchestration.
- `src/utils/queueTime.ts`: time helpers for queue scheduling decisions.
- `src-tauri/src/lib.rs`: plugin registration and native shell behavior.

**Development**

Prerequisites:
- Bun
- Rust toolchain
- Tauri prerequisites for your OS

Install:

```bash
bun install
```

Run desktop development:

```bash
bun run tauri dev
```

Quality checks:

```bash
bun run tsc --noEmit
bun run test
bun test
```

Build release:

```bash
bun run tauri build
```

Release bundles are generated under `src-tauri/target/release/bundle/`.

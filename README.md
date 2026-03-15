# Cognitive Science Model and Time-Block Theory

POMO is a desktop-first, queue-driven focus system built with Tauri v2, React 19, Vite, and Tailwind v4.
This page explains why the default block model is intentionally asymmetric and why break enforcement is treated as part of the algorithm, not optional decoration.

Block defaults used by the app:

| Block | Focus | Break | Cognitive intent |
| --- | --- | --- | --- |
| Mini | 15 min | 0 min | Administrative batching, low-switch-cost cleanup |
| Normal | 25 min | 5 min | Standard execution with residue reset |
| Deep | 52 min | 17 min | Biological rhythm alignment for sustained cognition |

1. Mini (15/0): Parkinson's Law and tactical throughput.
- Theory: administrative work is prone to time inflation if the boundary is soft.
- Scientific argument: Parkinson's Law predicts elastic expansion of low-complexity work when no explicit cap exists.
- Product implication: a strict 15-minute cap compresses intent-to-action latency and raises completion density.
- Why 0-minute break: for low depletion tasks, forced interruption creates more switching overhead than recovery benefit.

2. Normal (25/5): attention residue mitigation.
- Theory: when users jump from task A to task B, cognitive fragments of A remain active.
- Scientific argument: attention residue reduces working-memory availability and decision quality on the next task.
- Product implication: the 5-minute interval is a disengagement boundary that closes the previous cognitive loop.
- Behavioral target: reduce "half-present" execution and improve first-pass quality on queue transitions.

3. Deep (52/17): ultradian rhythm synchronization.
- Theory: deep work quality tracks biological cycles more than round numbers.
- Scientific argument: BRAC-style ultradian patterns suggest alternating high-focus and downshift windows through waking hours.
- Empirical framing: productivity telemetry literature often cites a 52/17 pattern among high-output workers.
- Product implication: 52 minutes captures sustained immersion; 17 minutes preserves next-cycle performance.

4. Mandatory break as neural mode-shift.
- Theory: breaks are computational phases, not idle void.
- Scientific argument: focused execution depends on task-positive systems; wakeful rest engages default-mode processes associated with integration and insight.
- Product implication: enforced breaks reduce burnout accumulation and support memory consolidation between heavy blocks.

Operational consequence of this model:
- Mini favors momentum.
- Normal favors clean context transfer.
- Deep favors long-horizon cognitive sustainability.
- Together they form a mixed strategy instead of one-size-fits-all pomodoro timing.

References:
- Leroy, S. (2009). Attention residue when switching between work tasks.
- Kleitman, N. (1982). Basic rest-activity cycle.
- Draugiem Group / DeskTime (2014). Rule of 52 and 17 analysis.
- Raichle, M. E., et al. (2001). Default mode of brain function.

# Implementation Architecture and State Machine

This page maps the theory to concrete implementation details in the app code.

Core state model:
- The canonical timer/queue state is centralized in `src/context/AppContext.tsx`.
- `durations` is initialized from `DEF_BLOCKS` in `src/types/index.ts`.
- Modes are explicit: `w` (work), `b` (break), `idle` (scheduled start), `wait` (micro-task wait mode).
- `activeQueueItem` tracks source provenance when work starts from queue.
- `miniPrompt` supports flow-specific prompting after mini completion.

State transitions (simplified):

```text
work running -> complete -> (break minutes > 0 ? break mode : completeWithoutBreak)
break running -> complete -> (pendingNext ? startPendingTask : paused break state)
idle running -> complete idle target -> start work block
work running + wait start -> wait mode -> resolveWait or abandonWait
```

Implementation highlights:
1. Break/no-break branching.
- In `completeBlock`, break duration is read from `durations[block][1]`.
- If break is `0`, `completeWithoutBreak` clears task context and returns to paused work state without entering `b` mode.

2. Queue-sourced reset integrity.
- `resetAndRequeue` in `AppContext` restores the active queue item (with updated task/notes/tags) to queue front.
- This preserves intent after interrupted starts and avoids silent task disappearance.

3. Pending-next during break.
- If a queue item is selected while break is active, the app stores it in `pendingNext`.
- On break completion, `startPendingTask` launches the queued item immediately.

4. Scheduled idle-time tasks.
- `getFixedTarget` in `src/utils/queueTime.ts` normalizes `HH:mm` or full datetime targets.
- If a plain time is already past today, it rolls to the next day.

5. Queue schedule resolution.
- `resolveQueueSchedule` computes a projected start map for visible queue entries.
- Fixed-time tasks are pinned first; flex tasks are placed around fixed windows to avoid overlaps.
- Sorting is stable by projected start then original index.

6. Weighted roulette pick.
- `rouletteQueuePick` filters to eligible non-archived, non-recurring tasks (plus due idle-time tasks).
- Aged unscheduled tasks can receive higher weight to reduce starvation.

Persistence and native boundaries:
- Tauri persistence uses `@tauri-apps/plugin-store` (`LazyStore`) with keys `state` and `history`.
- Import/export supports native dialog + fs plugin pathways.
- App bootstrap waits for async store initialization before rendering provider content.
- In non-Tauri test contexts, runtime checks guard native invocation paths.

Activity and metadata layers:
- Activity history stores statused entries (for example completed, early, abandoned, micro-task).
- History UI supports date/status filtering, contiguous grouping, and per-entry hide.
- Notes and tags move with queue selections and can be persisted/exported with state.

Testing and quality posture:
- Unit/integration tests cover queue lifecycle, activity behavior, timer controls, and scheduler-sensitive interactions.
- Bun compatibility is handled with preloaded jsdom bootstrap and matcher extension setup.

# Workflow Mechanics, Recurrence Engine, and Release Operations

This page describes end-user operations and contributor/release mechanics.

Queue workflow mechanics:
1. Add work to queue with block type, optional notes/tags, and optional idle time.
2. Execute by manual pick, next-in-queue scheduler decision, or roulette.
3. Archive tasks that should leave active view without deletion.
4. Delete tasks into trash, then restore or permanently clear.
5. Use wait mode when blocked; resolve back into the original work block or abandon with log trail.

Recurring engine behavior:
- Recurrence templates are stored as queue items marked recurring.
- A periodic generator checks date rules and creates concrete queue instances.
- Supported options include daily, alternate-day, weekday/holiday, and weekly custom-day patterns.
- Generated children are non-recurring execution items; template metadata tracks `lastGeneratedDate`.

Why archive, trash, and recurrence coexist:
- Archive preserves planned intent without active clutter.
- Trash supports safe recovery from accidental deletion.
- Recurrence creates future workload reliably without manual re-entry.
- Combined, they separate planning state from execution state.

Release and packaging mechanics:
- Contributor release flow is scripted in `scripts/release.js`.
- The script can bump version (`patch`, `minor`, `major`, or explicit), then sync:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
- Build strategy is platform-aware:
  - Windows: default Tauri build
  - macOS: app + dmg bundles
  - Linux: deb + rpm + appimage bundles
- Artifact collector scans `src-tauri/target/release/bundle` and uploads matching versioned outputs.
- GitHub release flow handles both create and upload-to-existing-tag paths.

Developer quick commands:

```bash
bun install
bun run tauri dev
bun run tsc --noEmit
bun run test
bun test
bun run tauri build
```

Operational summary:
- Page 1 defined why the model exists.
- Page 2 showed how the model is encoded in state transitions and scheduling code.
- Page 3 documented day-to-day queue/recurrence operations and the release pipeline.

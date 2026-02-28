import { useApp } from "./ctx";
import { BLOCK_NAMES, type Block } from "./types";

const R = 90, C = 2 * Math.PI * R;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Timer() {
    const { timeLeftMs, running, mode, block, task, queue, toggle, reset, finish, continueSame, nextInQueue, setBlock, setTask, durations } = useApp();
    const displaySec = Math.ceil(timeLeftMs / 1000);
    const [w, b] = mode === "idle" ? [0, 0] : durations[block as Block] || [0, 0];
    const totalMs = mode === "idle" ? 1 : (mode === "w" ? w : b) * 60000;
    const progress = mode === "idle" ? 1 : (1 - timeLeftMs / totalMs);

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex gap-1" style={{ opacity: running ? 0 : 1, pointerEvents: running ? "none" : "auto", transition: "opacity 0.2s" }}>
                {BLOCK_NAMES.map((b: Block) => (
                    <button key={b} className={`tab ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
                        {b}
                    </button>
                ))}
            </div>

            <input className="task-input" placeholder="Task name…" value={task} onChange={e => setTask(e.target.value)} />
            <p className="label">{mode === "w" ? "Focus" : mode === "b" ? "Rest" : "Scheduled Idle"}</p>

            <div className="relative w-48 h-48 flex items-center justify-center mb-2">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                        strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * Math.min(1, Math.max(0, progress))}
                        style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                </svg>
                <span className="time">{fmt(displaySec)}</span>
            </div>

            {mode === "w" && (
                <div className="flex gap-3">
                    <button className="btn transition-transform" onClick={toggle}>{running ? "Pause" : "Start"}</button>
                    {running && <button className="btn transition-transform" style={{ background: "var(--card)", color: "var(--text)" }} onClick={finish}>Finish</button>}
                    <button className="btn secondary transition-transform" onClick={reset}>Reset</button>
                </div>
            )}

            {mode === "b" && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-sm opacity-60 font-medium tracking-wide">Take a break. Or optionally skip to:</p>
                    <div className="flex gap-3 mt-1">
                        <button className="btn secondary transition-transform" onClick={continueSame}>Continue Same</button>
                        <button
                            className="btn highlight transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={nextInQueue}
                            disabled={queue.length === 0}
                        >
                            Next in Queue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

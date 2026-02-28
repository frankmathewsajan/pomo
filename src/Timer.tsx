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
        <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-sm px-4">
            <div className="flex gap-1 flex-wrap justify-center w-full" style={{ opacity: running ? 0 : 1, pointerEvents: running ? "none" : "auto", transition: "opacity 0.2s" }}>
                {BLOCK_NAMES.map((b: Block) => (
                    <button key={b} className={`tab flex-1 min-w-[3.5rem] !px-2 text-[10px] sm:text-xs ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
                        {b}
                    </button>
                ))}
            </div>

            <input className="task-input w-full text-center" placeholder="Task name…" value={task} onChange={e => setTask(e.target.value)} />
            <p className="label shrink-0">{mode === "w" ? "Focus" : mode === "b" ? "Rest" : "Scheduled Idle"}</p>

            <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center mb-2">
                <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                        strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * Math.min(1, Math.max(0, progress))}
                        style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                </svg>
                <span className="time text-4xl sm:text-5xl">{fmt(displaySec)}</span>
            </div>

            {mode === "w" && (
                <div className="flex gap-2 sm:gap-3 w-full max-w-[240px]">
                    <button className="btn transition-transform flex-1 !text-xs sm:!text-sm !py-2 sm:!py-2.5" onClick={toggle}>{running ? "Pause" : "Start"}</button>
                    {running && <button className="btn transition-transform flex-1 !text-xs sm:!text-sm !py-2 sm:!py-2.5" style={{ background: "var(--card)", color: "var(--text)" }} onClick={finish}>Finish</button>}
                    <button className="btn secondary transition-transform flex-1 !text-xs sm:!text-sm !py-2 sm:!py-2.5" onClick={reset}>Reset</button>
                </div>
            )}

            {mode === "b" && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <p className="text-xs sm:text-sm opacity-60 font-medium tracking-wide text-center">Take a break. Or optionally skip to:</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1 w-full max-w-[280px]">
                        <button className="btn secondary transition-transform flex-1 !text-xs sm:!text-sm !py-2 sm:!py-2.5" onClick={continueSame}>Continue Same</button>
                        <button
                            className="btn highlight transition-transform flex-1 !text-xs sm:!text-sm !py-2 sm:!py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
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

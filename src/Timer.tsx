import { useApp, BLOCK_NAMES, type Block } from "./ctx";

const R = 90, C = 2 * Math.PI * R;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const DUR: Record<Block, [number, number]> = { mini: [10, 2], normal: [25, 5], deep: [50, 10] };

export default function Timer() {
    const { seconds, running, mode, block, task, toggle, reset, setBlock, setTask } = useApp();
    const [w, b] = DUR[block];
    const total = (mode === "w" ? w : b) * 60;

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex gap-1">
                {BLOCK_NAMES.map(b => (
                    <button key={b} className={`tab ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
                        {b}
                    </button>
                ))}
            </div>
            <input className="task-input" placeholder="Task name…" value={task} onChange={e => setTask(e.target.value)} />
            <p className="label">{mode === "w" ? "Focus" : "Break"}</p>
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                        strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - seconds / total)}
                        style={{ transition: "stroke-dashoffset .4s" }} />
                </svg>
                <span className="time">{fmt(seconds)}</span>
            </div>
            <div className="flex gap-3">
                <button className="btn" onClick={toggle}>{running ? "Pause" : "Start"}</button>
                <button className="btn secondary" onClick={reset}>Reset</button>
            </div>
        </div>
    );
}

import { useApp } from "./ctx";

const R = 90, C = 2 * Math.PI * R;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Timer() {
    const { seconds, running, mode, toggle, reset } = useApp();
    const total = mode === "w" ? 25 * 60 : 5 * 60;
    const pct = seconds / total;

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="label">{mode === "w" ? "Focus" : "Break"}</p>
            <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                        strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
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

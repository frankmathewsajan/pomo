import { useEffect, useRef, useState } from "react";
import { useApp } from "./ctx";
import { BLOCK_NAMES, type Block } from "./types";
import { play90Sound, play100Sound } from "./sounds";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

const R = 90, C = 2 * Math.PI * R;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

async function notify(title: string, body: string) {
    if (typeof window === 'undefined' || !(window as any).__TAURI__) return;
    try {
        let ok = await isPermissionGranted();
        if (!ok) ok = (await requestPermission()) === 'granted';
        if (ok) sendNotification({ title, body });
    } catch (e) {
        console.error("Notification error:", e);
    }
}

export default function Timer() {
    const { timeLeftMs, running, mode, block, task, notes, queue, pendingNext, toggle, reset, finish, continueSame, nextInQueue, cancelPending, setBlock, setTask, setNotes, durations } = useApp();
    const displaySec = Math.ceil(timeLeftMs / 1000);
    const [w, b] = mode === "idle" ? [0, 0] : durations[block as Block] || [0, 0];
    const totalMs = mode === "idle" ? 1 : (mode === "w" ? w : b) * 60000;
    const progress = mode === "idle" ? 1 : (1 - timeLeftMs / totalMs);

    const [editingNotes, setEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(notes || "");

    useEffect(() => {
        setTempNotes(notes || "");
    }, [notes]);

    const notified90 = useRef(false);
    const notified100 = useRef(false);

    useEffect(() => {
        if (progress < 0.9) {
            notified90.current = false;
            notified100.current = false;
        }
        if (running && mode === "w") {
            if (progress >= 0.9 && !notified90.current && progress < 1.0) {
                notified90.current = true;
                play90Sound();
                notify("Almost done!", `Your ${block} block is 90% complete.`);
            }
            if (progress >= 1.0 && !notified100.current) {
                notified100.current = true;
                play100Sound();
                notify("Block complete!", `Your ${block} block has finished.`);
            }
        }
    }, [progress, running, mode, block]);

    return (
        <div className="flex flex-col items-center gap-4 sm:gap-6 w-full px-2 sm:px-6">
            <div className="flex gap-1.5 flex-wrap justify-center w-full max-w-[400px]" style={{ opacity: running ? 0 : 1, pointerEvents: running ? "none" : "auto", transition: "opacity 0.2s" }}>
                {BLOCK_NAMES.map((b: Block) => (
                    <button key={b} className={`tab flex-1 min-w-[4.5rem] !px-3 text-xs sm:text-sm font-bold tracking-wide ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
                        {b}
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center w-full max-w-[360px] gap-1">
                <input className="task-input w-full text-center !py-3" placeholder="Task name…" value={task} onChange={e => setTask(e.target.value)} />
                {mode === "w" && (
                    <div className="w-full text-center mt-1 text-sm">
                        {editingNotes ? (
                            <textarea
                                autoFocus
                                className="task-input w-full p-2 text-xs font-normal resize-none min-h-[60px] bg-black/5 rounded-md"
                                placeholder="Task notes (HTML supported)..."
                                value={tempNotes}
                                onChange={e => setTempNotes(e.target.value)}
                                onBlur={() => {
                                    setNotes(tempNotes);
                                    setEditingNotes(false);
                                }}
                            />
                        ) : (
                            <div
                                className="text-xs opacity-60 font-normal leading-relaxed cursor-text min-h-[20px] w-full text-center hover:bg-black/5 rounded transition-colors p-1"
                                onClick={() => setEditingNotes(true)}
                                dangerouslySetInnerHTML={{ __html: notes || "<i>Click to add notes...</i>" }}
                            />
                        )}
                    </div>
                )}
            </div>
            <p className="label shrink-0 tracking-widest uppercase opacity-70 text-[11px] font-black">{mode === "w" ? "Focus" : mode === "b" ? "Rest" : "Scheduled Idle"}</p>

            <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center my-2 sm:my-4">
                <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                        strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * Math.min(1, Math.max(0, progress))}
                        style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                </svg>
                <span className="time text-5xl sm:text-6xl tracking-tight">{fmt(displaySec)}</span>
            </div>

            {mode === "w" && (
                <div className="flex gap-3 sm:gap-4 w-full max-w-[300px]">
                    <button className="btn transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" onClick={toggle}>{running ? "Pause" : "Start"}</button>
                    {running && <button className="btn transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" style={{ background: "var(--card)", color: "var(--text)" }} onClick={finish}>Finish</button>}
                    <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" onClick={reset}>Reset</button>
                </div>
            )}

            {mode === "b" && (
                <div className="flex flex-col items-center gap-4 w-full">
                    {pendingNext ? (
                        <div className="flex flex-col items-center gap-2 w-full max-w-[320px]">
                            <p className="text-sm font-semibold tracking-wide text-center" style={{ color: "var(--accent)" }}>
                                ▶ Up next: <span className="font-bold">{pendingNext.task || "Untitled"}</span>
                                <span className="opacity-60 text-xs ml-1">({pendingNext.type})</span>
                            </p>
                            <p className="text-xs opacity-50 text-center">Starts automatically when break ends</p>
                            <button
                                className="btn secondary transition-transform !text-xs !py-1.5 !px-4 opacity-70 hover:opacity-100"
                                onClick={cancelPending}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm opacity-60 font-medium tracking-wide text-center">Take a break... or optionally skip to:</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[320px]">
                        <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" onClick={continueSame}>Continue Same</button>
                        <button
                            className="btn highlight transition-transform flex-1 !text-sm !py-2.5 sm:!py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={nextInQueue}
                            disabled={queue.length === 0 || !!pendingNext}
                        >
                            {pendingNext ? "Queued ✓" : "Next in Queue"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

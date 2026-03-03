import { useEffect, useRef, useState } from "react";
import { useApp } from "./ctx";
import { BLOCK_NAMES, type Block } from "./types";
import { play90Sound, play100Sound } from "./sounds";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import RichTextToolbar from "./RichTextToolbar";

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
    const {
        timeLeftMs, running, mode, block, task, notes, queue, pendingNext,
        toggle, reset, finish, continueSame, nextInQueue, cancelPending,
        setBlock, setTask, setNotes, durations,
        startWait, resolveWait, abandonWait, waitElapsedMs, waitLeftMs, waitTask, waitTargetMs,
        advancedNotes, toggleAdvancedNotes, waitEnabled
    } = useApp();

    const [waitSetup, setWaitSetup] = useState(false);
    const [waitInput, setWaitInput] = useState("");
    const [waitThresh, setWaitThresh] = useState<number>(5);

    const isWait = mode === "wait";
    const displaySec = isWait ? Math.floor(waitElapsedMs / 1000) : Math.ceil(timeLeftMs / 1000);
    const [w, b] = mode === "idle" ? [0, 0] : durations[block as Block] || [0, 0];
    const totalMs = mode === "idle" ? 1 : (mode === "w" ? w : b) * 60000;

    let progress = 1;
    if (mode === "idle") { progress = 1; }
    else if (isWait) {
        const waitTotalMs = waitElapsedMs + waitLeftMs;
        progress = waitTotalMs > 0 ? (waitLeftMs / waitTotalMs) : 0;
    } else {
        progress = 1 - (timeLeftMs / totalMs);
    }

    const [editingNotes, setEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(notes || "");
    const notesRef = useRef<HTMLTextAreaElement>(null);
    const notesContainerRef = useRef<HTMLDivElement>(null);

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
            {!waitSetup && (
                <div className="flex gap-1.5 flex-wrap justify-center w-full max-w-[400px]" style={{ opacity: running ? 0 : 1, pointerEvents: running ? "none" : "auto", transition: "opacity 0.2s" }}>
                    {BLOCK_NAMES.map((b: Block) => (
                        <button key={b} className={`tab flex-1 min-w-[4.5rem] !px-3 text-xs sm:text-sm font-bold tracking-wide ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
                            {b}
                        </button>
                    ))}
                    {waitEnabled && running && !isWait && mode === "w" && timeLeftMs > 0 && (
                        <button className="btn secondary !px-4 !py-2 shrink-0 col-span-3 hover:!bg-orange-500 hover:!text-white border border-black/5 transition-all text-orange-600" onClick={() => setWaitSetup(!waitSetup)}>
                            Wait
                        </button>
                    )}
                </div>
            )}

            {waitSetup ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-[400px] bg-black/5 p-4 sm:p-6 rounded-2xl shadow-sm border border-black/5">
                    <h3 className="text-md sm:text-lg font-bold tracking-tight">Pending Engagement</h3>
                    <p className="text-xs opacity-70 text-center font-medium leading-relaxed">Task blocked? Enter a micro-task and max timeout.</p>
                    <input className="task-input w-full text-center !py-3 bg-white" autoFocus placeholder="Micro-task name…" value={waitInput} onChange={e => setWaitInput(e.target.value)} />
                    <div className="flex gap-2 w-full">
                        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 5 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(5)}>5m Quick</button>
                        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 10 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(10)}>10m Mini</button>
                        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 25 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(25)}>25m Normal</button>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button className="btn highlight transition-transform flex-1 !text-sm !py-2.5" disabled={!waitInput.trim()} onClick={() => {
                            startWait(waitInput.trim() || "Wait Micro-task", waitThresh * 60000);
                            setWaitSetup(false);
                        }}>Start Hold</button>
                        <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5" onClick={() => setWaitSetup(false)}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center w-full max-w-[360px] gap-1">
                    <input className="task-input w-full text-center !py-3" disabled={isWait} placeholder="Task name…" value={task} onChange={e => setTask(e.target.value)} />
                    {(mode === "w" || isWait) && (
                        <div className="w-full text-center mt-1 text-sm">
                            {editingNotes ? (
                                <div
                                    ref={notesContainerRef}
                                    className="flex flex-col w-full relative group"
                                    onBlur={(e) => {
                                        if (!notesContainerRef.current?.contains(e.relatedTarget as Node)) {
                                            setNotes(tempNotes);
                                            setEditingNotes(false);
                                        }
                                    }}
                                >
                                    {advancedNotes && (
                                        <RichTextToolbar textareaRef={notesRef} value={tempNotes} onChange={setTempNotes} />
                                    )}
                                    <textarea
                                        ref={notesRef}
                                        autoFocus
                                        className={`task-input w-full p-2 text-xs font-normal resize-none min-h-[60px] bg-black/5 ${advancedNotes ? 'rounded-b-md rounded-t-none border-t-0' : 'rounded-md'}`}
                                        placeholder="Task notes (HTML supported)..."
                                        value={tempNotes}
                                        onChange={e => setTempNotes(e.target.value)}
                                    />
                                    <div className="flex justify-end items-center mt-1 px-1">
                                        <button
                                            type="button"
                                            className="text-[10px] font-bold opacity-60 hover:opacity-100 bg-black/5 px-2 py-1 rounded"
                                            onClick={() => { setNotes(tempNotes); setEditingNotes(false); }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="text-xs opacity-60 font-normal leading-relaxed min-h-[20px] w-full hover:bg-black/5 rounded transition-colors p-1 notes-content overflow-hidden text-center flex flex-col items-center"
                                    onClick={() => { if (!isWait) setEditingNotes(true); }}
                                    style={{ cursor: isWait ? "default" : "text" }}
                                >
                                    {notes ? (
                                        <div dangerouslySetInnerHTML={{ __html: notes }} className="w-full" style={{ textAlign: "center" }} />
                                    ) : (
                                        <i>Click to add notes...</i>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!waitSetup && (
                <>
                    <p className="label shrink-0 tracking-widest uppercase opacity-70 text-[11px] font-black">{isWait ? "Pending Engagement" : mode === "w" ? "Focus" : mode === "b" ? "Rest" : "Scheduled Idle"}</p>

                    <div className={`relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center my-2 sm:my-4 transition-all duration-500 ${isWait ? "scale-90 opacity-90" : ""}`}>
                        <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
                            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--accent)"
                                strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * Math.min(1, Math.max(0, progress))}
                                style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                        </svg>
                        {isWait ? (
                            <div className="flex flex-col items-center">
                                <span className="time text-4xl sm:text-5xl tracking-tight" style={{ color: "var(--accent)", transition: "color 0.3s" }}>{fmt(displaySec)}</span>
                                <span className="time text-sm opacity-40 mt-1 line-through" title="Paused main block">{fmt(Math.ceil(timeLeftMs / 1000))}</span>
                            </div>
                        ) : (
                            <span className="time text-5xl sm:text-6xl tracking-tight">{fmt(displaySec)}</span>
                        )}
                    </div>

                    {mode === "w" && (
                        <div className="flex gap-3 sm:gap-4 w-full max-w-[300px]">
                            <button className="btn transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" onClick={toggle}>{running ? "Pause" : "Start"}</button>
                            {running && <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5 sm:!py-3 opacity-90" onClick={() => { setWaitInput(""); setWaitSetup(true); }}>Wait</button>}
                            {running && <button className="btn transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" style={{ background: "var(--card)", color: "var(--text)" }} onClick={finish}>Finish</button>}
                            {!running && <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5 sm:!py-3" onClick={reset}>Reset</button>}
                        </div>
                    )}

                    {isWait && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <p className="text-xs font-semibold uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full" style={{ color: "var(--text)" }}>
                                Micro-task: <span style={{ color: "var(--accent)" }}>{waitTask}</span>
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-[320px]">
                                <button className="btn highlight transition-transform w-full !text-sm !py-2.5 sm:!py-3" onClick={resolveWait}>Reply Arrived (Resume Origin)</button>
                                <button className="btn secondary transition-transform w-full !text-sm !py-2.5 sm:!py-3 opacity-80 hover:bg-black/10" onClick={abandonWait}>Force Honourable Abandonment</button>
                            </div>
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
                </>
            )}
        </div>
    );
}

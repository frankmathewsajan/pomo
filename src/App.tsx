import { useState } from "react";
import { AppProvider, useApp } from "./ctx";
import Timer from "./Timer";
import { T } from "./themes";
import { BLOCK_NAMES, type Block } from "./types";

function ActivitySidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
    const { history } = useApp();
    const [filter, setFilter] = useState<"all" | "completed" | "early">("all");
    const [dateFilter, setDateFilter] = useState("");

    const filtered = history.filter(h => {
        if (filter !== "all" && h.status !== filter) return false;
        if (dateFilter && new Date(h.at).toLocaleDateString("en-CA") !== dateFilter) return false;
        return true;
    });

    if (!isOpen) {
        return (
            <div className="h-full border-r flex flex-col items-center justify-center py-6 bg-card shrink-0 cursor-pointer hover:bg-black/5 transition-colors" style={{ width: '56px', borderColor: 'var(--border-ring)' }} onClick={onToggle}>
                <span className="opacity-50 text-[11px] uppercase font-bold tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Activity</span>
            </div>
        );
    }

    return (
        <div className="w-80 border-r flex flex-col h-full bg-card overflow-hidden shrink-0" style={{ background: "var(--card)", borderColor: "var(--border-ring)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
            <div className="shrink-0 flex flex-col gap-4 border-b" style={{ padding: '1.25rem', borderColor: 'var(--border-ring)' }}>
                <div className="flex justify-between items-center">
                    <h2 className="label !m-0" style={{ opacity: 0.9 }}>Activity & History</h2>
                    <button className="wb w-6 h-6 rounded hover:bg-black/10" onClick={onToggle}>◀</button>
                </div>
                <div className="flex gap-2">
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "all" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("all")}>All</button>
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "completed" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("completed")}>Done</button>
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "early" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("early")}>Early</button>
                </div>

                <div className="relative w-full flex items-center group">
                    <input type="date" className="task-input w-full px-4 py-2 text-xs font-semibold h-10 border-none bg-black/5 focus:bg-white focus:ring-2 focus:ring-black/10 rounded-lg shadow-inner transition-all !max-w-none" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    {dateFilter && <button className="absolute right-2 wb w-6 h-6 opacity-60 hover:opacity-100 shrink-0 bg-white rounded shadow-sm border border-black/5" title="Clear Date" onClick={() => setDateFilter("")}>✕</button>}
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: '1.25rem' }}>
                {filtered.map((h, i) => (
                    <div key={i} className="hist-item relative text-left flex flex-col items-start gap-1 p-4 rounded transition-colors hover:bg-black/5 shrink-0" style={{ border: '1px solid var(--border-ring)' }}>
                        <div className="flex justify-between w-full items-center">
                            <span className="font-semibold text-sm truncate pr-2">{h.task || "Untitled"}</span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${h.status === "early" ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>
                                {h.status}
                            </span>
                        </div>
                        <span className="opacity-60 text-[10px] font-bold uppercase tracking-wider">{h.block} • {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-[13px] opacity-50 text-center py-6">No history found.</p>}
            </div>
        </div>
    );
}

function QueueSidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
    const { queue, setQueue, timeLeftMs, mode, block, durations } = useApp();
    const [qType, setQType] = useState<Block>("normal");
    const [qTask, setQTask] = useState("");
    const [isIdle, setIsIdle] = useState(false);
    const [qTime, setQTime] = useState("16:00");

    const addQueue = () => {
        if (!qTask.trim()) return;
        setQueue([...queue, {
            id: Math.random().toString(36).substring(7),
            type: qType,
            task: qTask,
            idleTime: isIdle ? qTime : undefined,
            isIdle
        }]);
        setQTask("");
        setIsIdle(false);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newQ = [...queue];
        [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]];
        setQueue(newQ);
    };

    const moveDown = (index: number) => {
        if (index === queue.length - 1) return;
        const newQ = [...queue];
        [newQ[index + 1], newQ[index]] = [newQ[index], newQ[index + 1]];
        setQueue(newQ);
    };

    let currentTime = new Date();
    currentTime.setSeconds(currentTime.getSeconds() + Math.ceil(timeLeftMs / 1000));

    if (mode === "w" && block !== "idle") {
        const bcfg = durations[block] || [0, 0];
        currentTime.setMinutes(currentTime.getMinutes() + bcfg[1]);
    }

    if (!isOpen) {
        return (
            <div className="h-full border-l flex flex-col items-center justify-center py-6 bg-card shrink-0 cursor-pointer hover:bg-black/5 transition-colors" style={{ width: '56px', borderColor: 'var(--border-ring)' }} onClick={onToggle}>
                <span className="opacity-50 text-[11px] uppercase font-bold tracking-widest" style={{ writingMode: 'vertical-rl' }}>Queue</span>
            </div>
        );
    }

    return (
        <div className="w-80 border-l flex flex-col h-full bg-card overflow-hidden shrink-0" style={{ background: "var(--card)", borderColor: "var(--border-ring)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
            <div className="border-b shrink-0 flex justify-between items-center" style={{ padding: '1rem 1.25rem', borderColor: 'var(--border-ring)' }}>
                <div className="flex items-center gap-3">
                    <button className="wb w-6 h-6 rounded hover:bg-black/10" onClick={onToggle}>▶</button>
                    <h2 className="label !m-0" style={{ opacity: 0.9 }}>Up Next</h2>
                </div>
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{queue.length} items</span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: '1.25rem' }}>
                {queue.map((q, i) => {
                    const startInfo = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (q.idleTime) {
                        const [h, m] = q.idleTime.split(":").map(Number);
                        let target = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), h, m);
                        if (target.getTime() <= currentTime.getTime()) target.setTime(target.getTime() + 86400000);
                        currentTime = target;
                    } else {
                        const bcfg = durations[q.type] || [25, 5];
                        currentTime.setMinutes(currentTime.getMinutes() + bcfg[0] + bcfg[1]);
                    }

                    return (
                        <div key={q.id} className="hist-item relative group text-left flex flex-col items-start gap-2 p-4 rounded transition-colors hover:bg-black/5 shrink-0" style={{ border: '1px solid var(--border-ring)' }}>
                            <div className="flex justify-between w-full items-start gap-2">
                                <span className="font-semibold text-sm leading-tight flex-1" style={{ wordBreak: 'break-word' }}>{q.task}</span>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={i === 0} onClick={() => moveUp(i)}>↑</button>
                                    <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={i === queue.length - 1} onClick={() => moveDown(i)}>↓</button>
                                    <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-red-500 hover:text-white" onClick={() => setQueue(queue.filter(x => x.id !== q.id))}>✕</button>
                                </div>
                            </div>
                            <span className="opacity-60 text-[10px] font-bold uppercase tracking-wider">{q.type} {q.idleTime ? `(scheduled ~ ${q.idleTime})` : ''} • ~{startInfo}</span>
                        </div>
                    );
                })}
                {queue.length === 0 && <p className="text-[13px] opacity-50 text-center py-6">Your queue is empty.</p>}
            </div>

            <div className="border-t flex flex-col gap-3 shrink-0 bg-black/5" style={{ padding: '1.25rem', borderColor: 'var(--border-ring)' }}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Add block</p>

                <input className="task-input w-full !text-left px-4 py-2 text-sm max-w-none border-none bg-white rounded-lg shadow-sm" placeholder="Task name..." value={qTask} onChange={e => setQTask(e.target.value)} />

                <div className="flex gap-2 w-full">
                    {BLOCK_NAMES.map(b => (
                        <button key={b} className={`pill flex-1 !px-2 !py-2 !text-xs capitalize ${qType === b ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setQType(b)}>{b}</button>
                    ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer w-fit select-none shrink-0 group">
                    <input type="checkbox" checked={isIdle} onChange={e => setIsIdle(e.target.checked)} className="cursor-pointer w-4 h-4 rounded text-black ring-0 border border-black/20" />
                    <span className="text-[13px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">Schedule Time</span>
                </label>

                {isIdle && (
                    <input type="time" className="task-input w-full px-4 py-2 h-10 text-sm max-w-none shadow-sm border-none bg-white rounded-lg" value={qTime} onChange={e => setQTime(e.target.value)} />
                )}

                <button className="btn w-full py-3 mt-1 font-semibold tracking-wide rounded-lg bg-black text-white shadow-md hover:opacity-90 transition-all border-none" onClick={addQueue}>+ Add to Queue</button>
            </div>
        </div>
    );
}

function Chrome() {
    const { theme, next } = useApp();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
            <div data-tauri-drag-region className="titlebar flex items-center justify-between px-8 py-5 select-none border-b transition-colors" style={{ borderColor: 'var(--border-ring)' }}>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-black opacity-40 hover:opacity-100 transition-opacity tracking-widest pl-2">POMO</span>
                </div>

                <div className="flex gap-2 z-50">
                    <button className="wb w-7 h-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().minimize()}>─</button>
                    <button className="wb close w-7 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().close()}>✕</button>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden backdrop-blur-3xl" style={{ backdropFilter: 'var(--backdrop)', WebkitBackdropFilter: 'var(--backdrop)' }}>
                <ActivitySidebar isOpen={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} />
                <main className="flex-1 min-w-[320px] flex flex-col items-center justify-center p-12 overflow-y-auto relative">
                    <div className="absolute top-8 right-8 z-50">
                        <div
                            className="relative flex items-center justify-center bg-black/10 rounded-full cursor-pointer transition-colors hover:bg-black/20 shadow-inner"
                            onClick={next}
                            style={{ width: '130px', height: '32px' }}
                            title="Switch Theme"
                        >
                            <div className="absolute inset-y-1 bg-white rounded-full shadow-sm transition-all duration-300" style={{ left: '4px', right: '4px', zIndex: 0 }} />
                            <div className="relative z-10 w-full text-center text-[10px] font-bold uppercase tracking-wider text-black/80 pointer-events-none">
                                {T[theme].name}
                            </div>
                        </div>
                    </div>
                    <Timer />
                </main>
                <QueueSidebar isOpen={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
            </div>
        </div>
    );
}

export default function App() {
    return <AppProvider><Chrome /></AppProvider>;
}

import { useState, useRef, useEffect } from "react";
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
    const [isRecurring, setIsRecurring] = useState(false);
    const [showRecurring, setShowRecurring] = useState(false);
    const [qTime, setQTime] = useState("16:00");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTaskStr, setEditTaskStr] = useState("");

    const addQueue = () => {
        if (!qTask.trim()) return;
        setQueue([...queue, {
            id: Math.random().toString(36).substring(7),
            type: qType,
            task: qTask,
            idleTime: isIdle ? qTime : undefined,
            isIdle,
            recurring: isRecurring
        }]);
        setQTask("");
        setIsIdle(false);
        setIsRecurring(false);
    };

    const moveUp = (id: string) => {
        const index = queue.findIndex(q => q.id === id);
        if (index <= 0) return;
        const newQ = [...queue];
        [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]];
        setQueue(newQ);
    };

    const moveDown = (id: string) => {
        const index = queue.findIndex(q => q.id === id);
        if (index === -1 || index === queue.length - 1) return;
        const newQ = [...queue];
        [newQ[index + 1], newQ[index]] = [newQ[index], newQ[index + 1]];
        setQueue(newQ);
    };

    const startEditing = (q: typeof queue[0]) => {
        setEditingId(q.id);
        setEditTaskStr(q.task);
    };

    const saveEdit = (id: string) => {
        if (!editTaskStr.trim()) {
            setEditingId(null);
            return;
        }
        setQueue(queue.map(q => q.id === id ? { ...q, task: editTaskStr } : q));
        setEditingId(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === "Enter") saveEdit(id);
        if (e.key === "Escape") setEditingId(null);
    };

    // Calculate base future time for queue relative to right now
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
                {(() => {
                    const hasNonRecurring = queue.some(q => !q.recurring);
                    const hasRecurring = queue.some(q => q.recurring);
                    const canHide = hasNonRecurring && hasRecurring;

                    const visibleQueue = queue.filter(q => (hasNonRecurring && !showRecurring) ? !q.recurring : true);

                    if (visibleQueue.length === 0) {
                        return <p className="text-[13px] opacity-50 text-center py-6">Your queue is empty.</p>;
                    }

                    return (
                        <>
                            {canHide && (
                                <button
                                    className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mb-1 w-full"
                                    onClick={() => setShowRecurring(!showRecurring)}
                                >
                                    {showRecurring ? "Hide Recurring" : "Show Recurring"}
                                    <span className="text-[8px]">{showRecurring ? "▲" : "▼"}</span>
                                </button>
                            )}
                            {visibleQueue.map((q, i) => {
                                // Real-time fix: Ensure future time calculation never drifts into the past
                                const realNow = new Date();
                                if (currentTime.getTime() < realNow.getTime()) {
                                    currentTime = new Date(realNow);
                                }

                                const startInfo = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                if (q.idleTime) {
                                    const [h, m] = q.idleTime.split(":").map(Number);
                                    let target = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), h, m);
                                    if (target.getTime() <= currentTime.getTime()) {
                                        target.setTime(target.getTime() + 86400000);
                                    }
                                    currentTime = target;
                                } else {
                                    const bcfg = durations[q.type] || [25, 5];
                                    currentTime.setMinutes(currentTime.getMinutes() + bcfg[0] + bcfg[1]);
                                }

                                const trueIndex = queue.findIndex(x => x.id === q.id);

                                const endInfo = new Date(currentTime.getTime());
                                endInfo.setMinutes(endInfo.getMinutes() + (durations[q.type as keyof typeof durations] || [25, 5])[0]);
                                const endInfoStr = endInfo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={q.id} className="hist-item relative group text-left flex flex-col justify-between gap-3 p-4 rounded transition-colors hover:bg-black/5 shrink-0" style={{ border: '1px solid var(--border-ring)' }}>
                                        <div className="absolute top-2 right-2 flex items-center bg-[var(--card)]/90 backdrop-blur-md rounded-md shadow-sm border border-[var(--border-ring)] opacity-0 group-hover:opacity-100 transition-opacity z-10 px-1 py-1">
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={trueIndex <= 0} onClick={() => moveUp(q.id)}>↑</button>
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={trueIndex >= queue.length - 1} onClick={() => moveDown(q.id)}>↓</button>
                                            {editingId !== q.id && <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-black/10 transition-colors" title="Edit" onClick={() => startEditing(q)}>✎</button>}
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-red-500 hover:text-white" onClick={() => setQueue(queue.filter(x => x.id !== q.id))}>✕</button>
                                        </div>

                                        <div className="flex justify-between w-full items-start gap-4 pr-1">
                                            <div className="flex-1 font-bold text-[14px] sm:text-[15px] leading-tight text-left cursor-text select-none text-[var(--text)]" style={{ wordBreak: 'break-word', minHeight: '1.5rem' }}>
                                                {editingId === q.id ? (
                                                    <input
                                                        className="task-input w-full text-sm font-semibold !p-1 -ml-1 h-auto"
                                                        value={editTaskStr}
                                                        onChange={e => setEditTaskStr(e.target.value)}
                                                        onKeyDown={e => handleEditKeyDown(e, q.id)}
                                                        onBlur={() => saveEdit(q.id)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span onClick={() => startEditing(q)}>{q.task}</span>
                                                )}
                                                {q.recurring && <span className="ml-2 text-[9px] font-black uppercase text-[#ffffff] bg-[var(--accent)] px-1.5 py-0.5 rounded-full inline-block align-middle mb-0.5 opacity-80" style={{ color: '#ffffff', backgroundColor: 'var(--accent)' }}>Recurring</span>}
                                                {q.idleTime && <span className="ml-2 text-[9px] font-black uppercase text-[var(--text)] bg-[var(--text)]/10 px-1.5 py-0.5 rounded-full inline-block align-middle mb-0.5 opacity-80 border border-[var(--text)]/20" style={{ color: 'var(--text)', borderColor: 'var(--text)' }}>Sched @ {q.idleTime}</span>}
                                            </div>

                                            <div className="shrink-0 text-right mt-0.5" style={{ color: 'var(--text)' }}>
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">
                                                    {q.type} ({(durations[q.type as keyof typeof durations] || [25, 5])[0]}m)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between w-full items-end mt-1" style={{ color: 'var(--text)' }}>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                                ~{startInfo}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                                ~{endInfoStr}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    );
                })()}
            </div>

            <div className="border-t flex flex-col gap-3 shrink-0 bg-black/5" style={{ padding: '1.25rem', borderColor: 'var(--border-ring)' }}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Add block</p>

                <input className="task-input w-full !text-left px-4 py-2 text-sm max-w-none border-none bg-white rounded-lg shadow-sm mb-3" placeholder="Task name..." value={qTask} onChange={e => setQTask(e.target.value)} />

                <div className="flex gap-2 w-full">
                    {BLOCK_NAMES.map(b => (
                        <button
                            key={b}
                            className="pill flex-1 !px-2 !py-2 transition-all duration-200"
                            style={{
                                backgroundColor: qType === b ? 'var(--accent)' : 'transparent',
                                color: qType === b ? '#ffffff' : 'var(--text)',
                                border: '1px solid var(--border-ring)',
                                opacity: qType === b ? 1 : 0.6,
                                transform: qType === b ? 'scale(1.05)' : 'none',
                                fontWeight: 'bold',
                                textTransform: 'capitalize',
                                fontSize: '0.75rem'
                            }}
                            onClick={() => setQType(b)}
                        >
                            {b}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-3 cursor-pointer w-fit select-none shrink-0 group" onClick={() => setIsRecurring(!isRecurring)}>
                        <div
                            className="relative w-8 h-4 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: isRecurring ? 'var(--accent)' : 'transparent', border: '1px solid var(--border-ring)' }}
                        >
                            <div
                                className={`absolute top-0.5 rounded-full shadow-sm transform transition-transform duration-300 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`}
                                style={{ width: '10px', height: '10px', left: '2px', backgroundColor: isRecurring ? '#ffffff' : 'var(--text)', opacity: isRecurring ? 1 : 0.7 }}
                            />
                        </div>
                        <span className="text-[12px] font-bold tracking-wide uppercase opacity-70 group-hover:opacity-100 transition-opacity">Recurring</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer w-fit select-none shrink-0 group" onClick={() => setIsIdle(!isIdle)}>
                        <div
                            className="relative w-8 h-4 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: isIdle ? 'var(--accent)' : 'transparent', border: '1px solid var(--border-ring)' }}
                        >
                            <div
                                className={`absolute top-0.5 rounded-full shadow-sm transform transition-transform duration-300 ${isIdle ? 'translate-x-4' : 'translate-x-0'}`}
                                style={{ width: '10px', height: '10px', left: '2px', backgroundColor: isIdle ? '#ffffff' : 'var(--text)', opacity: isIdle ? 1 : 0.7 }}
                            />
                        </div>
                        <span className="text-[12px] font-bold tracking-wide uppercase opacity-70 group-hover:opacity-100 transition-opacity">Schedule</span>
                    </label>
                </div>

                {isIdle && (
                    <input type="time" className="task-input flex-1 px-4 py-2 h-10 text-sm max-w-none shadow-sm border-none bg-white rounded-lg" value={qTime} onChange={e => setQTime(e.target.value)} />
                )}

                <button className="btn w-full py-3 mt-1 font-semibold tracking-wide rounded-lg bg-black text-white shadow-md hover:opacity-90 transition-all border-none" onClick={addQueue}>+ Add to Queue</button>
            </div>
        </div>
    );
}

function Chrome() {
    const { theme, next } = useApp();
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
            <div data-tauri-drag-region className="titlebar flex items-center justify-between px-8 py-5 select-none border-b transition-colors" style={{ borderColor: 'var(--border-ring)' }}>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-black opacity-40 hover:opacity-100 transition-opacity tracking-widest pl-2">&nbsp;&nbsp;&nbsp;POMO</span>
                </div>

                <div className="flex gap-2 z-50">
                    <button className="wb w-7 h-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().minimize()}>─</button>
                    <button className="wb w-7 h-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().toggleMaximize()}>□</button>
                    <button className="wb close w-7 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().close()}>✕</button>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden backdrop-blur-3xl" style={{ backdropFilter: 'var(--backdrop)', WebkitBackdropFilter: 'var(--backdrop)' }}>
                <ActivitySidebar isOpen={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} />
                <main className="flex-1 min-w-[320px] sm:min-w-[420px] flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative">
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

                    {/* Sync / Settings Menu */}
                    <div className="absolute bottom-8 left-8 z-50">
                        <SyncMenu />
                    </div>
                </main>
                <QueueSidebar isOpen={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
            </div>
        </div>
    );
}

function SyncMenu() {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = () => {
        const state = localStorage.getItem("pomo-state");
        const history = localStorage.getItem("pomo-history");
        const data = {
            state: state ? JSON.parse(state) : null,
            history: history ? JSON.parse(history) : null
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pomo-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
        setOpen(false);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.state) localStorage.setItem("pomo-state", JSON.stringify(data.state));
                if (data.history) localStorage.setItem("pomo-history", JSON.stringify(data.history));
                window.location.reload();
            } catch (err) {
                alert("Invalid configuration file");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                onClick={() => setOpen(!open)}
                title="Sync / Config"
            >
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
            {open && (
                <div className="absolute bottom-full left-0 mb-4 w-52 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-ring)", padding: "4px" }}>
                    <div className="flex flex-col text-[13px] font-medium opacity-90">
                        <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors" onClick={handleExport}>
                            Export Config (JSON)
                        </button>
                        <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors mt-1" onClick={handleImportClick}>
                            Import Config (JSON)
                        </button>
                    </div>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
    );
}

export default function App() {
    return <AppProvider><Chrome /></AppProvider>;
}

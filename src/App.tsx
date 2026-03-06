import { useState, useRef, useEffect } from "react";
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { AppProvider, useApp } from "./ctx";
import Timer from "./Timer";
import { T } from "./themes";
import { BLOCK_NAMES, type Block, type RecurringOption } from "./types";
import RichTextToolbar from "./RichTextToolbar";

function ActivitySidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
    const { history } = useApp();
    const [filter, setFilter] = useState<"all" | "completed" | "early" | "abandoned">("all");
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

    const groupedFiltered = filtered.reduce((acc: (typeof history[0] & { count: number })[], current) => {
        if (acc.length === 0) {
            acc.push({ ...current, count: 1 });
        } else {
            const last = acc[acc.length - 1];
            if (last.task === current.task && last.block === current.block && last.status === current.status) {
                last.count += 1;
            } else {
                acc.push({ ...current, count: 1 });
            }
        }
        return acc;
    }, []);

    return (
        <div className="w-80 border-r flex flex-col h-full bg-card overflow-hidden shrink-0" style={{ background: "var(--card)", borderColor: "var(--border-ring)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
            <div className="shrink-0 flex flex-col gap-4 border-b" style={{ padding: '1.25rem', borderColor: 'var(--border-ring)' }}>
                <div className="flex justify-between items-center">
                    <h2 className="label !m-0" style={{ opacity: 0.9 }}>Activity & History</h2>
                    <button className="wb w-6 h-6 rounded hover:bg-black/10" onClick={onToggle}>◀</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "all" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("all")}>All</button>
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "completed" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("completed")}>Done</button>
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "early" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("early")}>Early</button>
                    <button className={`pill !px-3 !py-1 !text-xs ${filter === "abandoned" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("abandoned")}>Wait drops</button>
                </div>

                <div className="relative w-full flex items-center group">
                    <input type="date" className="task-input w-full px-4 py-2 text-xs font-semibold h-10 border-none bg-black/5 focus:bg-white focus:ring-2 focus:ring-black/10 rounded-lg shadow-inner transition-all !max-w-none" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    {dateFilter && <button className="absolute right-2 wb w-6 h-6 opacity-60 hover:opacity-100 shrink-0 bg-white rounded shadow-sm border border-black/5" title="Clear Date" onClick={() => setDateFilter("")}>✕</button>}
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: '1.25rem' }}>
                {groupedFiltered.map((h, i) => (
                    <div key={i} className={`hist-item relative text-left flex flex-col items-start gap-1 p-4 rounded transition-colors hover:bg-black/5 shrink-0 ${h.status === "abandoned" ? "opacity-50" : ""}`} style={{ border: '1px solid var(--border-ring)' }}>
                        <div className="flex justify-between w-full items-center">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                                <span className={`font-semibold text-sm truncate ${h.status === "abandoned" ? "line-through" : ""}`}>{h.task || "Untitled"}</span>
                                {h.count > 1 && (
                                    <span className="text-[10px] font-bold opacity-60 bg-black/5 px-1.5 py-0.5 rounded-full shrink-0">
                                        x{h.count}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${h.status === "early" ? "bg-red-500/10 text-red-600" :
                                h.status === "abandoned" ? "bg-zinc-500/10 text-zinc-500" :
                                    h.status === "micro-task" ? "bg-blue-500/10 text-blue-500" :
                                        "bg-green-500/10 text-green-600"
                                }`}>
                                {h.status}
                            </span>
                        </div>
                        <span className="opacity-60 text-[10px] font-bold uppercase tracking-wider">{h.block} • {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                {groupedFiltered.length === 0 && <p className="text-[13px] opacity-50 text-center py-6">No history found.</p>}
            </div>
        </div>
    );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer w-fit select-none shrink-0 group" onClick={onToggle}>
            <div className="relative w-8 h-4 rounded-full transition-colors duration-300" style={{ backgroundColor: on ? 'var(--accent)' : 'transparent', border: '1px solid var(--border-ring)' }}>
                <div className={`absolute top-0.5 rounded-full shadow-sm transform transition-transform duration-300 ${on ? 'translate-x-4' : 'translate-x-0'}`} style={{ width: '10px', height: '10px', left: '2px', backgroundColor: on ? '#ffffff' : 'var(--text)', opacity: on ? 1 : 0.7 }} />
            </div>
            <span className="text-[12px] font-bold tracking-wide uppercase opacity-70 group-hover:opacity-100 transition-opacity">{label}</span>
        </label>
    );
}

function QueueSidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
    const { queue, setQueue, timeLeftMs, mode, block, durations, advancedNotes } = useApp();
    const [qType, setQType] = useState<Block>("normal");
    const [qTask, setQTask] = useState("");
    const qNotesRef = useRef<HTMLTextAreaElement>(null);
    const editNotesRef = useRef<HTMLTextAreaElement>(null);
    const [isIdle, setIsIdle] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recOption, setRecOption] = useState<RecurringOption>("daily");
    const [recDays, setRecDays] = useState<number[]>([]);
    const [showRecurring, setShowRecurring] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [qTime, setQTime] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    });
    const [qNotes, setQNotes] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTaskStr, setEditTaskStr] = useState("");
    const [editNotesStr, setEditNotesStr] = useState("");

    const addQueue = () => {
        if (!qTask.trim()) return;
        setQueue([...queue, {
            id: Math.random().toString(36).substring(7),
            type: qType,
            task: qTask,
            idleTime: isIdle ? qTime : undefined,
            isIdle,
            recurring: isRecurring,
            recurringOption: isRecurring ? recOption : undefined,
            recurringDays: isRecurring && recOption === "weekly" ? recDays : undefined,
            notes: qNotes.trim() || undefined,
            createdAt: Date.now()
        }]);
        setQTask("");
        setQNotes("");
        setIsIdle(false);
        setIsRecurring(false);
        setRecOption("daily");
        setRecDays([]);
    };

    const swapInQueue = (id: string, dir: -1 | 1, visible: typeof queue) => {
        const vi = visible.findIndex(q => q.id === id);
        const ti = vi + dir;
        if (ti < 0 || ti >= visible.length) return;
        const qi1 = queue.findIndex(q => q.id === id);
        const qi2 = queue.findIndex(q => q.id === visible[ti].id);
        const next = [...queue];
        [next[qi1], next[qi2]] = [next[qi2], next[qi1]];
        setQueue(next);
    };

    const startEditing = (q: typeof queue[0]) => {
        setEditingId(q.id);
        setEditTaskStr(q.task);
        setEditNotesStr(q.notes || "");
    };

    const saveEdit = (id: string) => {
        if (!editTaskStr.trim()) {
            setEditingId(null);
            return;
        }
        setQueue(queue.map(q => q.id === id ? { ...q, task: editTaskStr, notes: editNotesStr.trim() || undefined } : q));
        setEditingId(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEdit(id);
        }
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
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{queue.filter(q => !q.archived).length} items</span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: '1.25rem' }}>
                {(() => {
                    if (showTrash) {
                        const { trash, restoreTask, removeTask, emptyTrash } = useApp();

                        if (trash.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <p className="text-[13px] opacity-50 text-center py-6">Trash is empty.</p>
                                    <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1 mt-4" onClick={() => setShowTrash(false)}>Back to Queue</button>
                                </div>
                            );
                        }

                        return (
                            <>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Recently Deleted</h3>
                                    <button className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 opacity-80 hover:opacity-100" onClick={emptyTrash}>Empty Trash</button>
                                </div>
                                {trash.map(t => (
                                    <div key={t.id} className="hist-item relative group text-left flex justify-between gap-3 p-3 rounded transition-colors hover:bg-black/5 shrink-0 opacity-70 hover:opacity-100" style={{ border: '1px dashed var(--border-ring)' }}>
                                        <div className="flex flex-col gap-1 w-full overflow-hidden truncate">
                                            <span className="font-bold text-sm truncate">{t.task}</span>
                                            {t.notes && <span className="text-[10px] opacity-60 truncate">{t.notes}</span>}
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.type}</span>
                                            <button className="px-2 py-1 text-[10px] uppercase font-bold bg-green-500 text-white rounded shadow-sm hover:bg-green-600 active:scale-95 transition-all" onClick={() => restoreTask(t.id)}>Restore</button>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 flex justify-center w-full mt-auto">
                                    <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" onClick={() => setShowTrash(false)}>Back to Queue</button>
                                </div>
                            </>
                        );
                    }

                    const hasRecurring = queue.some(q => q.recurring && !q.archived);
                    const canHide = hasRecurring;

                    const visibleQueue = queue.filter(q => {
                        if (showArchived) return q.archived;
                        if (q.archived) return false;
                        if (!showRecurring && q.recurring) return false;
                        return true;
                    });

                    const getFixedTarget = (idleTime: string) => {
                        if (idleTime.includes("T")) return new Date(idleTime);
                        const target = new Date();
                        const [h, m] = idleTime.split(":").map(Number);
                        target.setHours(h, m, 0, 0);
                        if (target.getTime() <= Date.now()) {
                            target.setTime(target.getTime() + 86400000);
                        }
                        return target;
                    };

                    const realNow = new Date();
                    const fixedBlocks = visibleQueue.filter(q => q.idleTime).map(q => {
                        const target = getFixedTarget(q.idleTime!);
                        const bcfg = durations[q.type as keyof typeof durations] || [25, 5];
                        const end = new Date(target.getTime());
                        end.setMinutes(end.getMinutes() + bcfg[0] + bcfg[1]);
                        return { id: q.id, start: target.getTime(), end: end.getTime() };
                    });

                    const resolvedMap = new Map<string, { start: Date, end: Date, originalIndex: number }>();

                    visibleQueue.forEach((q, idx) => {
                        if (q.idleTime) {
                            const target = getFixedTarget(q.idleTime);
                            const end = new Date(target.getTime());
                            end.setMinutes(end.getMinutes() + (durations[q.type as keyof typeof durations] || [25, 5])[0]);
                            resolvedMap.set(q.id, { start: target, end, originalIndex: idx });
                        }
                    });

                    let iterTime = new Date(currentTime.getTime());

                    visibleQueue.forEach((q, idx) => {
                        if (q.idleTime) return;

                        if (iterTime.getTime() < realNow.getTime()) {
                            iterTime = new Date(realNow);
                        }

                        const bcfg = durations[q.type as keyof typeof durations] || [25, 5];
                        const blockDurMs = bcfg[0] * 60000;
                        const blockTotalMs = (bcfg[0] + bcfg[1]) * 60000;

                        let validStart = new Date(iterTime.getTime());
                        let overlap = true;

                        while (overlap && fixedBlocks.length > 0) {
                            overlap = false;
                            const tentativeEnd = new Date(validStart.getTime() + blockTotalMs);

                            for (const fb of fixedBlocks) {
                                if (tentativeEnd.getTime() > fb.start && validStart.getTime() < fb.end) {
                                    validStart = new Date(fb.end);
                                    overlap = true;
                                    break;
                                }
                            }
                        }

                        const start = validStart;
                        const end = new Date(start.getTime() + blockDurMs);
                        resolvedMap.set(q.id, { start, end, originalIndex: idx });

                        iterTime = new Date(start.getTime() + blockTotalMs);
                    });

                    const resolvedQueue = [...visibleQueue].sort((a, b) => {
                        const resA = resolvedMap.get(a.id)!;
                        const resB = resolvedMap.get(b.id)!;
                        const diff = resA.start.getTime() - resB.start.getTime();
                        if (diff !== 0) return diff;
                        return resA.originalIndex - resB.originalIndex;
                    });

                    if (resolvedQueue.length === 0 && !showArchived) {
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
                            {resolvedQueue.map((q, i) => {
                                const res = resolvedMap.get(q.id)!;
                                const startInfoStr = res.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (q.idleTime ? " " + res.start.toLocaleDateString([], { month: 'short', day: 'numeric' }) : "");
                                const endInfoStr = res.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (q.idleTime ? " " + res.end.toLocaleDateString([], { month: 'short', day: 'numeric' }) : "");

                                const isScheduled = !!q.idleTime;
                                const isOldTask = !isScheduled && !q.recurring && q.createdAt ? (realNow.getTime() - q.createdAt) > 86400000 : false;

                                return (
                                    <div key={q.id} className="hist-item relative group text-left flex flex-col justify-between gap-3 p-4 rounded transition-colors hover:bg-black/5 shrink-0" style={{ border: `1px ${isScheduled ? 'double' : 'solid'} ${isOldTask ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-ring)'}`, borderWidth: isScheduled ? '3px' : '1px' }}>
                                        <div className="absolute top-2 right-2 flex items-center bg-[var(--card)]/90 backdrop-blur-md rounded-md shadow-sm border border-[var(--border-ring)] opacity-0 group-hover:opacity-100 transition-opacity z-10 px-1 py-1">
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={i <= 0} onClick={() => swapInQueue(q.id, -1, resolvedQueue)}>↑</button>
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" disabled={i >= resolvedQueue.length - 1} onClick={() => swapInQueue(q.id, 1, resolvedQueue)}>↓</button>
                                            {editingId !== q.id && <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-black/10 transition-colors" title="Edit" onClick={() => startEditing(q)}>✎</button>}
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-black/10 transition-colors" title={q.archived ? "Unarchive" : "Archive"} onClick={() => setQueue(queue.map(x => x.id === q.id ? { ...x, archived: !x.archived } : x))}>{q.archived ? "⇧" : "⇩"}</button>
                                            <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-red-500 hover:text-white" onClick={() => { const { removeTask } = useApp(); removeTask(q.id); }}>✕</button>
                                        </div>

                                        <div className="flex justify-between w-full items-start gap-4 pr-1">
                                            <div className="flex-1 font-bold text-[14px] sm:text-[15px] leading-tight text-left cursor-text select-none text-[var(--text)]" style={{ wordBreak: 'break-word', minHeight: '1.5rem' }}>
                                                {editingId === q.id ? (
                                                    <div className="flex flex-col gap-2 w-full pr-8">
                                                        <input
                                                            className="task-input w-full text-sm font-semibold !p-1 -ml-1 h-auto"
                                                            value={editTaskStr}
                                                            onChange={e => setEditTaskStr(e.target.value)}
                                                            onKeyDown={e => handleEditKeyDown(e, q.id)}
                                                            autoFocus
                                                        />
                                                        {advancedNotes && (
                                                            <div className="-ml-1">
                                                                <RichTextToolbar textareaRef={editNotesRef} value={editNotesStr} onChange={setEditNotesStr} />
                                                            </div>
                                                        )}
                                                        <textarea
                                                            ref={editNotesRef}
                                                            className={`task-input w-full text-xs font-normal !p-1 -ml-1 h-auto resize-none min-h-[60px] ${advancedNotes ? 'bg-black/5 rounded-b-md rounded-t-none border-t-0' : 'bg-transparent'}`}
                                                            value={editNotesStr}
                                                            onChange={e => setEditNotesStr(e.target.value)}
                                                            onKeyDown={e => handleEditKeyDown(e, q.id)}
                                                            placeholder="Notes (HTML supported)..."
                                                        />
                                                        <div className="flex gap-2 justify-start mt-1 mb-2">
                                                            <button className="btn highlight !py-1 !px-3 !text-[11px] rounded" onClick={() => saveEdit(q.id)}>Save</button>
                                                            <button className="btn secondary !py-1 !px-3 !text-[11px] rounded" onClick={() => setEditingId(null)}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 w-full pb-1">
                                                        <span>
                                                            <span onClick={() => startEditing(q)}>{q.task}</span>
                                                            {q.recurring && (
                                                                <span className="ml-1 inline-flex items-center justify-center align-middle mb-0.5 opacity-80" style={{ color: 'var(--accent)' }} title="Recurring">
                                                                    &nbsp;
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                        </span>
                                                        {q.notes && (
                                                            <div
                                                                className="text-xs opacity-70 mt-1.5 font-normal leading-relaxed overflow-hidden notes-content"
                                                                dangerouslySetInnerHTML={{ __html: q.notes }}
                                                                onClick={() => startEditing(q)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 text-right mt-0.5">
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">
                                                    {q.type} ({(durations[q.type] || [25, 5])[0]}m)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between w-full items-end mt-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">~{startInfoStr}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">~{endInfoStr}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-2 border-t border-[var(--border-ring)] flex justify-between items-center w-full mt-2 px-1">
                                <button
                                    className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1"
                                    onClick={() => setShowArchived(!showArchived)}
                                >
                                    {showArchived ? "Back to Queue" : `View Archive (${queue.filter(q => q.archived).length})`}
                                </button>
                                <button
                                    className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1"
                                    onClick={() => setShowTrash(true)}
                                    title="View Deleted Tasks"
                                >
                                    Trash ({useApp().trash.length})
                                </button>
                            </div>
                        </>
                    );
                })()}
            </div>

            <div className="border-t flex flex-col gap-3 shrink-0 bg-black/5" style={{ padding: '1.25rem', borderColor: 'var(--border-ring)' }}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Add block</p>

                <input className="task-input w-full !text-left px-4 py-2 text-sm max-w-none border-none bg-white rounded-lg shadow-sm mb-3" placeholder="Task name..." value={qTask} onChange={e => setQTask(e.target.value)} />

                {advancedNotes && (
                    <RichTextToolbar textareaRef={qNotesRef} value={qNotes} onChange={setQNotes} />
                )}
                <textarea
                    ref={qNotesRef}
                    className={`task-input w-full !text-left px-4 py-2 text-xs max-w-none bg-white shadow-sm mb-3 resize-none min-h-[50px] ${advancedNotes ? 'border-t-0 rounded-b-lg' : 'border-none rounded-lg'}`}
                    placeholder="Notes (HTML supported)..."
                    value={qNotes}
                    onChange={e => setQNotes(e.target.value)}
                />

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
                    <Toggle on={isRecurring} onToggle={() => setIsRecurring(!isRecurring)} label="Recurring" />
                    <Toggle on={isIdle} onToggle={() => setIsIdle(!isIdle)} label="Schedule" />
                </div>

                {isRecurring && (
                    <div className="flex flex-col gap-2 mt-2 bg-white/5 p-2 rounded-lg border border-black/5">
                        <select
                            className="task-input text-xs font-bold w-full !py-1.5 focus:ring-0 cursor-pointer bg-white"
                            value={recOption}
                            onChange={(e) => setRecOption(e.target.value as RecurringOption)}
                        >
                            <option value="daily">Everyday</option>
                            <option value="alternate">Alternate Days</option>
                            <option value="weekdays">Weekdays (Tue-Sat)</option>
                            <option value="holidays">Holidays (Sun-Mon)</option>
                            <option value="weekly">Specific Days</option>
                        </select>
                        {recOption === "weekly" && (
                            <div className="flex gap-1 justify-between px-1 mt-1">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, dIdx) => (
                                    <button
                                        key={day}
                                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${recDays.includes(dIdx) ? "bg-[var(--accent)] text-white" : "bg-black/10 opacity-50 hover:opacity-100 text-[var(--text)]"}`}
                                        onClick={() => {
                                            setRecDays(prev => prev.includes(dIdx) ? prev.filter(d => d !== dIdx) : [...prev, dIdx].sort());
                                        }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isIdle && (
                    <input type="datetime-local" className="task-input flex-1 px-4 py-2 h-10 text-sm max-w-none shadow-sm border-none bg-white rounded-lg mt-2" value={qTime} onChange={e => setQTime(e.target.value)} />
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

    const toggleLeft = () => {
        if (!leftOpen && rightOpen && window.innerWidth < 1100) {
            setRightOpen(false);
        }
        setLeftOpen(!leftOpen);
    };

    const toggleRight = () => {
        if (!rightOpen && leftOpen && window.innerWidth < 1100) {
            setLeftOpen(false);
        }
        setRightOpen(!rightOpen);
    };

    // Auto-collapse if the window size gets too small natively
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 950 && leftOpen && rightOpen) {
                // If window width is too small to hold both sidebars gracefully, collapse one
                setRightOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [leftOpen, rightOpen]);

    useEffect(() => {
        const calculateAndSetWidth = async () => {
            try {
                const appWindow = getCurrentWindow();
                // We know min-height is 500 from tauri.conf.json.
                // Keep the current logical height, just adjust width.
                const factor = await appWindow.scaleFactor();
                const currentPhysical = await appWindow.innerSize();
                const currentLogical = currentPhysical.toLogical(factor);

                // Base app width is 460 to ensure no overlap for Timer controls
                const leftWidth = leftOpen ? 360 : 56;
                const rightWidth = rightOpen ? 360 : 56;

                // Allow dynamic expansion and shrinking
                // Base 500 prevents Timer from crushing absolute buttons
                const targetWidth = 720 + leftWidth + rightWidth;

                // Explicitly set the width so closing a sidebar visually snaps it shut
                await appWindow.setSize(new LogicalSize(targetWidth, currentLogical.height));
            } catch (err) {
                console.error("Failed to resize window:", err);
            }
        };

        // Let's only run in Tauri (where __TAURI__ is defined)
        if ((window as any).__TAURI__) {
            calculateAndSetWidth();
        }
    }, [leftOpen, rightOpen]);

    const nextThemeIndex = (theme + 1) % T.length;
    const nextThemeAccent = T[nextThemeIndex].v["--accent"];

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
            <div data-tauri-drag-region className="titlebar flex items-center justify-between px-8 py-5 select-none border-b transition-colors" style={{ borderColor: 'var(--border-ring)' }}>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-black opacity-40 hover:opacity-100 transition-opacity tracking-widest pl-2">&nbsp;&nbsp;&nbsp;POMO</span>
                </div>

                <div className="flex gap-2 z-50">
                    <button className="wb w-7 h-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => getCurrentWindow().minimize()}>─</button>
                    <button className="wb w-7 h-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => getCurrentWindow().toggleMaximize()}>□</button>
                    <button className="wb close w-7 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded" onClick={() => getCurrentWindow().close()}>✕</button>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden backdrop-blur-3xl" style={{ backdropFilter: 'var(--backdrop)', WebkitBackdropFilter: 'var(--backdrop)' }}>
                <ActivitySidebar isOpen={leftOpen} onToggle={toggleLeft} />
                <main className="flex-1 min-w-[500px] flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative">

                    <Timer />

                    {/* Bottom Left Controls */}
                    <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-50 flex flex-col items-center gap-4">
                        <button
                            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105"
                            onClick={next}
                            title={`Next Theme: ${T[nextThemeIndex].name}`}
                        >
                            <svg className="w-5 h-5 transition-colors" style={{ color: nextThemeAccent, opacity: 0.85 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                        </button>

                        <SyncMenu />
                    </div>
                </main>
                <QueueSidebar isOpen={rightOpen} onToggle={toggleRight} />
            </div>
        </div>
    );
}

// Add toggleAdvancedNotes to App context sync menu 
function SyncMenu() {
    const { waitEnabled, toggleWaitEnabled, advancedNotes, toggleAdvancedNotes } = useApp();
    const [open, setOpen] = useState(false);
    const [exportNotice, setExportNotice] = useState<string | null>(null);
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
        setExportNotice(`Saved to Downloads: ${a.download}`);
        setTimeout(() => setExportNotice(null), 3500);
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
                <div className="absolute bottom-full left-0 mb-4 w-52 rounded-sm shadow-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-ring)", padding: "4px" }}>
                    <div className="flex flex-col text-[13px] font-medium opacity-90">
                        <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors" onClick={handleExport}>
                            Export Config (JSON)
                        </button>
                        <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors mt-1" onClick={handleImportClick}>
                            Import Config (JSON)
                        </button>
                        <div className="px-4 py-2 border-t mt-1 border-black/5 flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors" onClick={toggleWaitEnabled}>
                            <span>Wait function</span>
                            <span className="font-bold opacity-70">{waitEnabled ? "ON" : "OFF"}</span>
                        </div>
                        <div className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors" onClick={toggleAdvancedNotes}>
                            <span>Advanced Notes</span>
                            <span className="font-bold opacity-70">{advancedNotes ? "ON" : "OFF"}</span>
                        </div>
                    </div>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />

            {exportNotice && (
                <div className="absolute bottom-1/2 left-16 shrink-0 w-[240px] px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold bg-green-500/10 text-green-700 border border-green-500/20 backdrop-blur-md animate-fade-in z-50 pointer-events-none">
                    {exportNotice}
                </div>
            )}
        </div>
    );
}

export default function App() {
    return <AppProvider><Chrome /></AppProvider>;
}

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "./themes";
import { type Block, type QueuedBlock, type Entry, DEF_BLOCKS } from "./types";
import { playStartSound } from "./sounds";

const K = "pomo-state", HK = "pomo-history";

type PendingNext = {
    type: Block;
    task: string;
    notes: string;
    idleTime?: string;
} | null;

type S = {
    theme: number;
    running: boolean;
    mode: "w" | "b" | "idle";
    block: Block | "idle";
    task: string;
    queue: QueuedBlock[];
    durations: Record<Block, readonly [number, number]>;
    targetMs: number | null; // Absolute time when the current block ends
    pausedLeftMs: number | null; // Milliseconds remaining when paused
    notes: string;
    pendingNext: PendingNext;
    lastQueuePopDate?: string;
    lastQueuePopIndex?: number;
};

const def: S = {
    theme: 0, running: false, mode: "w", block: "normal", task: "", queue: [],
    durations: DEF_BLOCKS, targetMs: null, pausedLeftMs: DEF_BLOCKS.normal[0] * 60000, notes: "",
    pendingNext: null
};
const load = (): S => {
    try {
        const stored = JSON.parse(localStorage.getItem(K)!);
        return { ...def, ...stored, queue: stored.queue || [], durations: stored.durations || DEF_BLOCKS };
    } catch { return def; }
};
const loadH = (): Entry[] => { try { return JSON.parse(localStorage.getItem(HK)!) || []; } catch { return []; } };

type Ctx = S & {
    history: Entry[];
    timeLeftMs: number;
    toggle: () => void;
    reset: () => void;
    finish: () => void;
    continueSame: () => void;
    nextInQueue: () => void;
    cancelPending: () => void;
    next: () => void;
    setBlock: (b: Block) => void;
    setTask: (t: string) => void;
    setNotes: (n: string) => void;
    setQueue: (q: QueuedBlock[]) => void;
    setDuration: (b: Block, w: number, br: number) => void;
};
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
    const [s, set] = useState(load);
    const [history, setHistory] = useState(loadH);
    const ref = useRef(s);
    ref.current = s;
    const [now, setNow] = useState(Date.now());

    useEffect(() => { localStorage.setItem(K, JSON.stringify(s)); }, [s]);
    useEffect(() => { localStorage.setItem(HK, JSON.stringify(history)); }, [history]);

    // High fidelity absolute time ticker
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, []);

    // Daily recurring task round robin
    useEffect(() => {
        const today = new Date(now).toLocaleDateString("en-CA"); // e.g., "YYYY-MM-DD"
        if (s.lastQueuePopDate !== today) {
            set(p => {
                if (p.lastQueuePopDate === today) return p; // Prevent race

                const recurringTasks = p.queue.filter(q => q.recurring && !q.archived);
                if (recurringTasks.length > 0) {
                    const nextIndex = ((p.lastQueuePopIndex ?? -1) + 1) % recurringTasks.length;
                    const template = recurringTasks[nextIndex];

                    const newTask: QueuedBlock = {
                        ...template,
                        id: Math.random().toString(36).substring(7),
                        recurring: false,
                        idleTime: undefined,
                        createdAt: Date.now()
                    };

                    return { ...p, queue: [...p.queue, newTask], lastQueuePopDate: today, lastQueuePopIndex: nextIndex };
                }

                return { ...p, lastQueuePopDate: today };
            });
        }
    }, [now, s.lastQueuePopDate]);

    const startBreak = (c: S) => {
        const b = (c.durations[c.block as Block] || [0, 0])[1];
        set({ ...c, mode: "b", running: true, targetMs: Date.now() + b * 60000, pausedLeftMs: null });
    };

    const startPendingTask = (c: S) => {
        const p = c.pendingNext;
        if (!p) return;
        playStartSound();
        if (p.idleTime) {
            let target: number;
            if (p.idleTime.includes("T")) {
                target = new Date(p.idleTime).getTime();
            } else {
                const ct = new Date();
                const [h, m] = p.idleTime.split(":").map(Number);
                target = new Date(ct.getFullYear(), ct.getMonth(), ct.getDate(), h, m).getTime();
                if (target <= ct.getTime()) target += 86400000;
            }
            set({ ...c, mode: "idle", block: p.type, task: p.task, notes: p.notes, running: true, targetMs: target, pausedLeftMs: null, pendingNext: null });
        } else {
            const dur = (c.durations[p.type] || [25, 5])[0] * 60000;
            set({ ...c, mode: "w", block: p.type, task: p.task, notes: p.notes, running: true, targetMs: Date.now() + dur, pausedLeftMs: null, pendingNext: null });
        }
    };

    const completeBlock = () => {
        const c = ref.current;
        if (c.mode === "w") {
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "completed" as const }, ...h].slice(0, 50));
            startBreak(c);
        } else if (c.mode === "b") {
            if (c.pendingNext) {
                startPendingTask(c);
            } else {
                set({ ...c, running: false, targetMs: null, pausedLeftMs: 0 });
            }
        } else if (c.mode === "idle") {
            const dur = (c.durations[c.block as Block] || [10, 2])[0] * 60000;
            set({ ...c, mode: "w", running: true, targetMs: Date.now() + dur, pausedLeftMs: null });
        }
    };

    let timeLeftMs = s.running && s.targetMs ? Math.max(0, s.targetMs - now) : (s.pausedLeftMs || 0);

    useEffect(() => {
        if (s.running && s.targetMs && now >= s.targetMs) completeBlock();
    }, [now, s.running, s.targetMs]);

    useEffect(() => {
        const r = document.documentElement;
        const t = T[s.theme];
        Object.entries(t.v).forEach(([k, v]) => r.style.setProperty(k, v));
        r.className = t.cls;
    }, [s.theme]);

    const v: Ctx = {
        ...s, history, timeLeftMs,
        toggle: () => set(p => {
            if (p.running) {
                return { ...p, running: false, targetMs: null, pausedLeftMs: timeLeftMs };
            } else {
                return { ...p, running: true, targetMs: Date.now() + (p.pausedLeftMs || 0), pausedLeftMs: null };
            }
        }),
        reset: () => set(p => {
            let left = 0;
            if (p.mode === "idle") left = 1000;
            else left = p.durations[p.block as Block][p.mode === "w" ? 0 : 1] * 60000;
            return { ...p, running: false, targetMs: null, pausedLeftMs: left };
        }),
        finish: () => {
            const c = ref.current;
            if (c.mode !== "w") return;
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "early" as const }, ...h].slice(0, 50));
            startBreak(c);
        },
        continueSame: () => set(p => {
            if (p.mode === "b" && p.running) {
                return {
                    ...p,
                    pendingNext: {
                        type: p.block as Block,
                        task: p.task,
                        notes: p.notes,
                        idleTime: undefined
                    }
                };
            }
            const dur = (p.durations[p.block as Block] || [25, 5])[0] * 60000;
            return { ...p, mode: "w", running: true, targetMs: Date.now() + dur, pausedLeftMs: null, pendingNext: null };
        }),
        nextInQueue: () => set(p => {
            const selectable = p.queue.filter(q => !q.archived && !q.recurring);

            if (selectable.length === 0) {
                const [w] = p.durations[p.block as Block] || [10, 2];
                return { ...p, mode: "w", running: false, targetMs: null, pausedLeftMs: w * 60000, task: "", notes: "", pendingNext: null };
            }

            const getFixedTarget = (idleTime: string) => {
                if (idleTime.includes("T")) return new Date(idleTime);
                const target = new Date();
                const [h, m] = idleTime.split(":").map(Number);
                target.setHours(h, m, 0, 0);
                if (target.getTime() <= Date.now()) target.setTime(target.getTime() + 86400000);
                return target;
            };

            const fixedBlocks = selectable.filter(q => q.idleTime).map(q => {
                const target = getFixedTarget(q.idleTime!);
                const bcfg = p.durations[q.type as keyof typeof p.durations] || [25, 5];
                const end = new Date(target.getTime());
                end.setMinutes(end.getMinutes() + bcfg[0] + bcfg[1]);
                return { id: q.id, start: target.getTime(), end: end.getTime() };
            });

            const resolvedMap = new Map<string, number>();
            selectable.forEach(q => {
                if (q.idleTime) resolvedMap.set(q.id, getFixedTarget(q.idleTime).getTime());
            });

            let timeLeftMs = p.running && p.targetMs ? Math.max(0, p.targetMs - Date.now()) : (p.pausedLeftMs || 0);
            let iterTime = new Date();
            iterTime.setSeconds(iterTime.getSeconds() + Math.ceil(timeLeftMs / 1000));
            if (p.mode === "w" && p.block !== "idle") {
                const bcfg = p.durations[p.block as Block] || [0, 0];
                iterTime.setMinutes(iterTime.getMinutes() + bcfg[1]);
            }

            selectable.forEach(q => {
                if (q.idleTime) return;
                if (iterTime.getTime() < Date.now()) iterTime = new Date();

                const bcfg = p.durations[q.type as keyof typeof p.durations] || [25, 5];
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
                resolvedMap.set(q.id, validStart.getTime());
                iterTime = new Date(validStart.getTime() + blockTotalMs);
            });

            let qItem = selectable[0];
            let qIndex = p.queue.findIndex(q => q.id === qItem.id);
            let minTime = resolvedMap.get(qItem.id)!;

            for (let i = 1; i < selectable.length; i++) {
                const itemTime = resolvedMap.get(selectable[i].id)!;
                if (itemTime < minTime) {
                    minTime = itemTime;
                    qItem = selectable[i];
                    qIndex = p.queue.findIndex(q => q.id === qItem.id);
                }
            }

            if (qItem) {
                let nextQ = [...p.queue];
                nextQ.splice(qIndex, 1);

                // During break that's still running: queue the task to start after break ends
                if (p.mode === "b" && p.running) {
                    return {
                        ...p,
                        queue: nextQ,
                        pendingNext: {
                            type: qItem.type as Block,
                            task: qItem.task,
                            notes: qItem.notes || "",
                            idleTime: qItem.idleTime
                        }
                    };
                }

                // Not in break — start immediately (e.g. from idle state)
                if (qItem.idleTime) {
                    let target: number;
                    if (qItem.idleTime.includes("T")) {
                        target = new Date(qItem.idleTime).getTime();
                    } else {
                        const ct = new Date();
                        const [h, m] = qItem.idleTime.split(":").map(Number);
                        target = new Date(ct.getFullYear(), ct.getMonth(), ct.getDate(), h, m).getTime();
                        if (target <= ct.getTime()) target += 86400000;
                    }
                    return { ...p, mode: "idle", block: qItem.type as Block, task: qItem.task, notes: qItem.notes || "", queue: nextQ, running: true, targetMs: target, pausedLeftMs: null, pendingNext: null };
                } else {
                    const dur = (p.durations[qItem.type as Block] || [25, 5])[0] * 60000;
                    return { ...p, mode: "w", block: qItem.type as Block, task: qItem.task, notes: qItem.notes || "", queue: nextQ, running: true, targetMs: Date.now() + dur, pausedLeftMs: null, pendingNext: null };
                }
            } else {
                const [w] = p.durations[p.block as Block] || [10, 2];
                return { ...p, mode: "w", running: false, targetMs: null, pausedLeftMs: w * 60000, task: "", notes: "", pendingNext: null };
            }
        }),
        cancelPending: () => set(p => {
            if (!p.pendingNext) return { ...p, pendingNext: null };
            const restored: QueuedBlock = {
                id: Math.random().toString(36).substring(7),
                type: p.pendingNext.type,
                task: p.pendingNext.task,
                notes: p.pendingNext.notes,
                idleTime: p.pendingNext.idleTime,
            };
            return { ...p, pendingNext: null, queue: [restored, ...p.queue] };
        }),
        next: () => set(p => ({ ...p, theme: (p.theme + 1) % T.length })),
        setBlock: (b) => set(p => ({ ...p, block: b, mode: "w", running: false, targetMs: null, pausedLeftMs: p.durations[b][0] * 60000 })),
        setTask: (t) => set(p => ({ ...p, task: t })),
        setNotes: (n) => set(p => ({ ...p, notes: n })),
        setQueue: (q) => set(p => ({ ...p, queue: q })),
        setDuration: (b, w, br) => set(p => ({ ...p, durations: { ...p.durations, [b]: [w, br] } }))
    };

    return <C.Provider value={v}>{children}</C.Provider>;
}

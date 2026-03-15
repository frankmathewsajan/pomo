import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "../utils/themes";
import { type Block, type QueuedBlock, type Entry, DEF_BLOCKS } from "../types";
import { playStartSound } from "../utils/sounds";
import { getFixedTarget } from "../utils/queueTime";
import { LazyStore } from "@tauri-apps/plugin-store";

const STORE = new LazyStore("pomo-state.json");
const STORE_STATE_KEY = "state";
const STORE_HISTORY_KEY = "history";

type PendingNext = {
    type: Block;
    task: string;
    notes: string;
    idleTime?: string;
    tags?: string[];
    sourceQueueItem?: QueuedBlock;
} | null;

type S = {
    theme: number;
    running: boolean;
    mode: "w" | "b" | "idle" | "wait";
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
    waitStartMs?: number;
    waitTargetMs?: number;
    waitTask?: string;
    waitNotes?: string;
    advancedNotes?: boolean;
    waitEnabled?: boolean;
    trash: QueuedBlock[];
    globalTags: string[];
    currentTags?: string[];
    activeQueueItem: QueuedBlock | null;
    miniPrompt: boolean;
};

const def: S = {
    theme: 0, running: false, mode: "w", block: "normal", task: "", queue: [],
    durations: DEF_BLOCKS, targetMs: null, pausedLeftMs: DEF_BLOCKS.normal[0] * 60000, notes: "",
    pendingNext: null, trash: [], globalTags: [], currentTags: [], activeQueueItem: null, miniPrompt: false
};

function normalizeState(stored: unknown): S {
    if (!stored || typeof stored !== "object") return def;
    const candidate = stored as Partial<S>;
    return {
        ...def,
        ...candidate,
        queue: Array.isArray(candidate.queue) ? candidate.queue : [],
        durations: candidate.durations || DEF_BLOCKS,
        trash: Array.isArray(candidate.trash) ? candidate.trash : [],
        globalTags: Array.isArray(candidate.globalTags) ? candidate.globalTags : [],
        currentTags: Array.isArray(candidate.currentTags) ? candidate.currentTags : [],
    };
}

function normalizeHistory(stored: unknown): Entry[] {
    return Array.isArray(stored) ? (stored as Entry[]) : [];
}

type Ctx = S & {
    history: Entry[];
    timeLeftMs: number;
    waitElapsedMs: number;
    waitLeftMs: number;
    advancedNotes: boolean;
    toggleAdvancedNotes: () => void;
    waitEnabled: boolean;
    toggleWaitEnabled: () => void;
    toggle: () => void;
    reset: () => void;
    finish: () => void;
    continueSame: () => void;
    startWait: (task: string, durationMs: number) => void;
    resolveWait: () => void;
    abandonWait: () => void;
    resetAndRequeue: () => void;
    nextInQueue: () => void;
    chooseFromQueue: (id: string) => void;
    rouletteQueuePick: () => void;
    cancelPending: () => void;
    next: () => void;
    setBlock: (b: Block) => void;
    setTask: (t: string) => void;
    setNotes: (n: string) => void;
    setQueue: (q: QueuedBlock[]) => void;
    removeTask: (id: string) => void;
    restoreTask: (id: string) => void;
    emptyTrash: () => void;
    setDuration: (b: Block, w: number, br: number) => void;
    addGlobalTag: (tag: string) => void;
    removeGlobalTag: (tag: string) => void;
    setCurrentTags: (tags: string[]) => void;
    exportConfig: () => Promise<{ state: S; history: Entry[] }>;
    importConfig: (data: { state?: unknown; history?: unknown }) => Promise<void>;
};
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
    const [s, set] = useState<S>(def);
    const [history, setHistory] = useState<Entry[]>([]);
    const [isInitializing, setIsInitializing] = useState(true);
    const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__?.invoke;
    const ref = useRef(s);
    ref.current = s;

    useEffect(() => {
        if (!isTauri) {
            setIsInitializing(false);
            return;
        }

        const initialize = async () => {
            try {
                const [storedState, storedHistory] = await Promise.all([
                    STORE.get(STORE_STATE_KEY),
                    STORE.get(STORE_HISTORY_KEY),
                ]);
                set(normalizeState(storedState));
                setHistory(normalizeHistory(storedHistory));
            } catch (error) {
                console.error("Failed to initialize store:", error);
                set(def);
                setHistory([]);
            } finally {
                setIsInitializing(false);
            }
        };

        void initialize();
    }, [isTauri]);

    useEffect(() => {
        if (isInitializing || !isTauri) return;
        void (async () => {
            try {
                await STORE.set(STORE_STATE_KEY, s);
                await STORE.set(STORE_HISTORY_KEY, history);
                await STORE.save();
            } catch (error) {
                console.error("Failed to persist store:", error);
            }
        })();
    }, [s, history, isInitializing, isTauri]);

    // Daily recurring task round robin
    useEffect(() => {
        const generateRecurringTasks = () => {
            const today = new Date();
            const todayStr = today.toLocaleDateString("en-CA");

            set(p => {
                let changed = false;
                let nextQ = [...p.queue];
                const activeTemplates = nextQ.filter(q => q.recurring && !q.archived);

                for (const t of activeTemplates) {
                    if (t.lastGeneratedDate === todayStr) continue;

                    let shouldGenerate = false;
                    const opt = t.recurringOption || "daily";
                    const day = today.getDay();

                    if (opt === "daily") {
                        shouldGenerate = true;
                    } else if (opt === "alternate") {
                        if (!t.lastGeneratedDate) {
                            shouldGenerate = true;
                        } else {
                            const lastDate = new Date(t.lastGeneratedDate);
                            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays >= 2) shouldGenerate = true;
                        }
                    } else if (opt === "weekdays") {
                        if (day >= 2 && day <= 6) shouldGenerate = true;
                    } else if (opt === "holidays") {
                        if (day === 0 || day === 1) shouldGenerate = true;
                    } else if (opt === "weekly") {
                        if (t.recurringDays && t.recurringDays.includes(day)) shouldGenerate = true;
                    }

                    if (shouldGenerate) {
                        let newIdleTime = undefined;
                        if (t.idleTime) {
                            if (t.idleTime.includes("T")) {
                                const timePart = t.idleTime.split("T")[1];
                                newIdleTime = `${todayStr}T${timePart}`;
                            } else {
                                newIdleTime = `${todayStr}T${t.idleTime}`;
                            }
                        }

                        const newTask: QueuedBlock = {
                            ...t,
                            id: Math.random().toString(36).substring(7),
                            recurring: false,
                            idleTime: newIdleTime,
                            createdAt: Date.now()
                        };
                        nextQ.push(newTask);

                        const templateIndex = nextQ.findIndex(q => q.id === t.id);
                        if (templateIndex !== -1) {
                            nextQ[templateIndex] = { ...nextQ[templateIndex], lastGeneratedDate: todayStr };
                        }
                        changed = true;
                    }
                }

                if (changed) {
                    return { ...p, queue: nextQ };
                }
                return p;
            });
        };

        generateRecurringTasks();
        const id = setInterval(generateRecurringTasks, 60000);
        return () => clearInterval(id);
    }, []);

    const startBreak = (c: S) => {
        const b = (c.durations[c.block as Block] || [0, 0])[1];
        set({ ...c, mode: "b", running: true, targetMs: Date.now() + b * 60000, pausedLeftMs: null });
    };

    const completeWithoutBreak = (c: S) => {
        const workMs = (c.durations[c.block as Block] || [25, 0])[0] * 60000;
        set({
            ...c,
            mode: "w",
            running: false,
            targetMs: null,
            pausedLeftMs: workMs,
            task: "",
            notes: "",
            currentTags: [],
            pendingNext: null,
            activeQueueItem: null,
            miniPrompt: c.block === "mini"
        });
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
            set({ ...c, mode: "idle", block: p.type, task: p.task, notes: p.notes, currentTags: p.tags, running: true, targetMs: target, pausedLeftMs: null, pendingNext: null, activeQueueItem: p.sourceQueueItem || null, miniPrompt: false });
        } else {
            const dur = (c.durations[p.type] || [25, 5])[0] * 60000;
            set({ ...c, mode: "w", block: p.type, task: p.task, notes: p.notes, currentTags: p.tags, running: true, targetMs: Date.now() + dur, pausedLeftMs: null, pendingNext: null, activeQueueItem: p.sourceQueueItem || null, miniPrompt: false });
        }
    };

    const completeBlock = () => {
        const c = ref.current;
        if (c.mode === "w") {
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "completed" as const, tags: c.currentTags }, ...h].slice(0, 50));
            const breakMinutes = (c.durations[c.block as Block] || [0, 0])[1];
            if (breakMinutes > 0) {
                startBreak(c);
            } else {
                completeWithoutBreak(c);
            }
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

    const startWait = (task: string, durationMs: number) => {
        const c = ref.current;
        if (c.mode !== "w" || !c.running) return;
        const left = c.targetMs ? Math.max(0, c.targetMs - Date.now()) : (c.pausedLeftMs || 0);
        set({
            ...c,
            mode: "wait",
            running: false,
            targetMs: null,
            pausedLeftMs: left,
            waitStartMs: Date.now(),
            waitTargetMs: Date.now() + durationMs,
            waitTask: task,
            waitNotes: ""
        });
    };

    const resolveWait = () => {
        const c = ref.current;
        if (c.mode !== "wait") return;
        setHistory(h => [{ task: c.waitTask || "Wait Micro-task", block: "mini" as Block, at: Date.now(), status: "micro-task" as const }, ...h].slice(0, 50));

        set({
            ...c,
            mode: "w",
            running: true,
            targetMs: c.pausedLeftMs ? Date.now() + c.pausedLeftMs : null,
            pausedLeftMs: null,
            waitStartMs: undefined,
            waitTargetMs: undefined,
            waitTask: undefined,
            waitNotes: undefined
        });
    };

    const abandonWait = () => {
        const c = ref.current;
        if (c.mode !== "wait") return;

        setHistory(h => [
            { task: c.waitTask || "Wait Micro-task", block: "mini" as Block, at: Date.now(), status: "micro-task" as const },
            { task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "abandoned" as const, tags: c.currentTags },
            ...h
        ].slice(0, 50));

        set({
            ...c,
            mode: "w",
            running: false,
            targetMs: null,
            task: "",
            notes: "",
            waitStartMs: undefined,
            waitTargetMs: undefined,
            waitTask: undefined,
            waitNotes: undefined
        });
    };

    const startQueueItem = (p: S, qItem: QueuedBlock, qIndex: number): S => {
        const nextQ = [...p.queue];
        nextQ.splice(qIndex, 1);

        if (p.mode === "b" && p.running) {
            return {
                ...p,
                queue: nextQ,
                pendingNext: {
                    type: qItem.type as Block,
                    task: qItem.task,
                    notes: qItem.notes || "",
                    idleTime: qItem.idleTime,
                    tags: qItem.tags,
                    sourceQueueItem: qItem
                },
                miniPrompt: false
            };
        }

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
            return {
                ...p,
                mode: "idle",
                block: qItem.type as Block,
                task: qItem.task,
                notes: qItem.notes || "",
                currentTags: qItem.tags || [],
                queue: nextQ,
                running: true,
                targetMs: target,
                pausedLeftMs: null,
                pendingNext: null,
                activeQueueItem: qItem,
                miniPrompt: false
            };
        }

        const dur = (p.durations[qItem.type as Block] || [25, 5])[0] * 60000;
        return {
            ...p,
            mode: "w",
            block: qItem.type as Block,
            task: qItem.task,
            notes: qItem.notes || "",
            currentTags: qItem.tags || [],
            queue: nextQ,
            running: true,
            targetMs: Date.now() + dur,
            pausedLeftMs: null,
            pendingNext: null,
            activeQueueItem: qItem,
            miniPrompt: false
        };
    };

    const nowMs = Date.now();
    let timeLeftMs = s.running && s.targetMs ? Math.max(0, s.targetMs - nowMs) : (s.pausedLeftMs || 0);
    let waitElapsedMs = s.mode === "wait" && s.waitStartMs ? Math.max(0, nowMs - s.waitStartMs) : 0;
    let waitLeftMs = s.mode === "wait" && s.waitTargetMs ? Math.max(0, s.waitTargetMs - nowMs) : 0;

    useEffect(() => {
        if (!s.running || !s.targetMs || s.mode === "wait") return;
        const timeoutMs = Math.max(0, s.targetMs - Date.now());
        const id = setTimeout(() => completeBlock(), timeoutMs);
        return () => clearTimeout(id);
    }, [s.running, s.targetMs, s.mode]);

    useEffect(() => {
        if (s.mode !== "wait" || !s.waitTargetMs) return;
        const timeoutMs = Math.max(0, s.waitTargetMs - Date.now());
        const id = setTimeout(() => abandonWait(), timeoutMs);
        return () => clearTimeout(id);
    }, [s.mode, s.waitTargetMs]);

    useEffect(() => {
        const r = document.documentElement;
        const t = T[s.theme];
        Object.entries(t.v).forEach(([k, v]) => r.style.setProperty(k, v));
        r.className = t.cls;
    }, [s.theme]);

    const v: Ctx = {
        ...s, history, timeLeftMs, waitElapsedMs, waitLeftMs,
        advancedNotes: !!s.advancedNotes,
        toggleAdvancedNotes: () => set(p => ({ ...p, advancedNotes: !p.advancedNotes })),
        waitEnabled: s.waitEnabled !== false,
        toggleWaitEnabled: () => set(p => ({ ...p, waitEnabled: p.waitEnabled === false })),
        toggle: () => set(p => {
            if (p.mode === "wait") return p; // toggle shouldn't affect wait
            if (p.running) {
                const runtimeLeftMs = p.targetMs ? Math.max(0, p.targetMs - Date.now()) : (p.pausedLeftMs || 0);
                return { ...p, running: false, targetMs: null, pausedLeftMs: runtimeLeftMs };
            } else {
                return { ...p, running: true, targetMs: Date.now() + (p.pausedLeftMs || 0), pausedLeftMs: null, miniPrompt: false };
            }
        }),
        reset: () => set(p => {
            let left = 0;
            if (p.mode === "idle") left = 1000;
            else left = p.durations[p.block as Block][p.mode === "w" ? 0 : 1] * 60000;
            return { ...p, running: false, targetMs: null, pausedLeftMs: left, miniPrompt: false };
        }),
        resetAndRequeue: () => set(p => {
            if (p.mode !== "w" || p.running || !p.activeQueueItem) return p;
            const restored: QueuedBlock = {
                ...p.activeQueueItem,
                task: p.task,
                notes: p.notes,
                tags: p.currentTags,
            };
            const left = p.durations[p.block as Block][0] * 60000;
            return {
                ...p,
                running: false,
                targetMs: null,
                pausedLeftMs: left,
                task: "",
                notes: "",
                currentTags: [],
                activeQueueItem: null,
                miniPrompt: false,
                queue: [restored, ...p.queue]
            };
        }),
        finish: () => {
            const c = ref.current;
            if (c.mode !== "w") return;
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "early" as const, tags: c.currentTags }, ...h].slice(0, 50));
            const breakMinutes = (c.durations[c.block as Block] || [0, 0])[1];
            if (breakMinutes > 0) {
                startBreak(c);
            } else {
                completeWithoutBreak(c);
            }
        },
        startWait,
        resolveWait,
        abandonWait,
        continueSame: () => set(p => {
            if (p.mode === "b" && p.running) {
                return {
                    ...p,
                    pendingNext: {
                        type: p.block as Block,
                        task: p.task,
                        notes: p.notes,
                        idleTime: undefined,
                        tags: p.currentTags,
                        sourceQueueItem: p.activeQueueItem || undefined
                    },
                    miniPrompt: false
                };
            }
            const dur = (p.durations[p.block as Block] || [25, 5])[0] * 60000;
            return { ...p, mode: "w", running: true, targetMs: Date.now() + dur, pausedLeftMs: null, pendingNext: null, miniPrompt: false };
        }),
        nextInQueue: () => set(p => {
            const selectable = p.queue.filter(q => !q.archived && !q.recurring);

            if (selectable.length === 0) {
                const [w] = p.durations[p.block as Block] || [10, 2];
                return { ...p, mode: "w", running: false, targetMs: null, pausedLeftMs: w * 60000, task: "", notes: "", currentTags: [], pendingNext: null, activeQueueItem: null, miniPrompt: false };
            }

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
                return startQueueItem(p, qItem, qIndex);
            } else {
                const [w] = p.durations[p.block as Block] || [10, 2];
                return { ...p, mode: "w", running: false, targetMs: null, pausedLeftMs: w * 60000, task: "", notes: "", currentTags: [], pendingNext: null, activeQueueItem: null, miniPrompt: false };
            }
        }),
        chooseFromQueue: (id) => set(p => {
            const selectable = p.queue.filter(q => !q.archived && !q.recurring);
            const qItem = selectable.find(q => q.id === id);
            if (!qItem) return p;
            const qIndex = p.queue.findIndex(q => q.id === qItem.id);
            if (qIndex === -1) return p;
            return startQueueItem(p, qItem, qIndex);
        }),
        rouletteQueuePick: () => set(p => {
            const now = Date.now();
            const candidates = p.queue.filter(q => {
                if (q.archived || q.recurring) return false;
                if (!q.idleTime) return true;
                return getFixedTarget(q.idleTime).getTime() <= now;
            });

            if (candidates.length === 0) return p;

            const weighted = candidates.map(q => {
                const isOld = !q.idleTime && !!q.createdAt && (now - q.createdAt) > 86400000;
                return { q, weight: isOld ? 4 : 1 };
            });

            const total = weighted.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * total;
            let chosen = weighted[weighted.length - 1].q;

            for (const item of weighted) {
                roll -= item.weight;
                if (roll <= 0) {
                    chosen = item.q;
                    break;
                }
            }

            const qIndex = p.queue.findIndex(q => q.id === chosen.id);
            if (qIndex === -1) return p;
            return startQueueItem(p, chosen, qIndex);
        }),
        cancelPending: () => set(p => {
            if (!p.pendingNext) return { ...p, pendingNext: null };
            const restored: QueuedBlock = {
                id: Math.random().toString(36).substring(7),
                type: p.pendingNext.type,
                task: p.pendingNext.task,
                notes: p.pendingNext.notes,
                idleTime: p.pendingNext.idleTime,
                tags: p.pendingNext.tags,
            };
            return { ...p, pendingNext: null, queue: [restored, ...p.queue] };
        }),
        next: () => set(p => ({ ...p, theme: (p.theme + 1) % T.length })),
        setBlock: (b) => set(p => ({ ...p, block: b, mode: "w", running: false, targetMs: null, pausedLeftMs: p.durations[b][0] * 60000, miniPrompt: false })),
        setTask: (t) => set(p => ({ ...p, task: t, miniPrompt: t.trim() ? false : p.miniPrompt })),
        setNotes: (n) => set(p => ({ ...p, notes: n })),
        setQueue: (q) => set(p => ({ ...p, queue: q })),
        removeTask: (id) => set(p => {
            const taskToRemove = p.queue.find(q => q.id === id);
            if (!taskToRemove) return p;
            const currentTrash = Array.isArray(p.trash) ? p.trash : [];
            const newTrash = [taskToRemove, ...currentTrash].slice(0, 50);
            return { ...p, queue: p.queue.filter(q => q.id !== id), trash: newTrash };
        }),
        restoreTask: (id) => set(p => {
            const currentTrash = Array.isArray(p.trash) ? p.trash : [];
            const taskToRestore = currentTrash.find(t => t.id === id);
            if (!taskToRestore) return p;
            return { ...p, trash: currentTrash.filter(t => t.id !== id), queue: [...p.queue, taskToRestore] };
        }),
        emptyTrash: () => set(p => ({ ...p, trash: [] })),
        setDuration: (b, w, br) => set(p => {
            const nextDurations = { ...p.durations, [b]: [w, br] as const };
            const nextState: S = { ...p, durations: nextDurations };

            if (!p.running && p.mode === "w" && p.block === b) {
                nextState.pausedLeftMs = w * 60000;
            }

            return nextState;
        }),
        addGlobalTag: (t) => set(p => p.globalTags.includes(t) ? p : { ...p, globalTags: [...p.globalTags, t] }),
        removeGlobalTag: (t) => set(p => ({ ...p, globalTags: p.globalTags.filter(x => x !== t) })),
        setCurrentTags: (tags) => set(p => ({ ...p, currentTags: tags })),
        exportConfig: async () => ({ state: ref.current, history }),
        importConfig: async (data) => {
            const state = normalizeState(data.state);
            const nextHistory = normalizeHistory(data.history);
            set(state);
            setHistory(nextHistory);
            if (!isTauri) return;
            await STORE.set(STORE_STATE_KEY, state);
            await STORE.set(STORE_HISTORY_KEY, nextHistory);
            await STORE.save();
        }
    };

    if (isInitializing) return null;

    return <C.Provider value={v}>{children}</C.Provider>;
}

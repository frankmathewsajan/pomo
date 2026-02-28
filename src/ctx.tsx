import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "./themes";
import { type Block, type QueuedBlock, type Entry, type HistoryStatus, DEF_BLOCKS, BLOCK_NAMES } from "./types";

const K = "pomo-state", HK = "pomo-history";

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
};

const def: S = {
    theme: 0, running: false, mode: "w", block: "normal", task: "", queue: [],
    durations: DEF_BLOCKS, targetMs: null, pausedLeftMs: DEF_BLOCKS.normal[0] * 60000
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
    next: () => void;
    setBlock: (b: Block) => void;
    setTask: (t: string) => void;
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

    const completeBlock = () => {
        const c = ref.current;
        if (c.mode === "w") {
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "completed" as HistoryStatus }, ...h].slice(0, 50));
            const bcfg = c.durations[c.block as Block] || [0, 0];
            const b = bcfg[1];
            set({ ...c, mode: "b", running: true, targetMs: Date.now() + b * 60000, pausedLeftMs: null });
        } else if (c.mode === "b") {
            set({ ...c, running: false, targetMs: null, pausedLeftMs: 0 });
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
            setHistory(h => [{ task: c.task || "Untitled", block: c.block as Block, at: Date.now(), status: "early" as HistoryStatus }, ...h].slice(0, 50));
            const bcfg = c.durations[c.block as Block] || [0, 0];
            const b = bcfg[1];
            set({ ...c, mode: "b", running: true, targetMs: Date.now() + b * 60000, pausedLeftMs: null });
        },
        continueSame: () => set(p => {
            const dur = (p.durations[p.block as Block] || [25, 5])[0] * 60000;
            return { ...p, mode: "w", running: true, targetMs: Date.now() + dur, pausedLeftMs: null };
        }),
        nextInQueue: () => set(p => {
            const qItem = p.queue[0];
            if (qItem) {
                const nextQ = p.queue.slice(1);
                if (qItem.idleTime) {
                    const ct = new Date();
                    const [h, m] = qItem.idleTime.split(":").map(Number);
                    let target = new Date(ct.getFullYear(), ct.getMonth(), ct.getDate(), h, m).getTime();
                    if (target <= ct.getTime()) target += 86400000;
                    return { ...p, mode: "idle", block: qItem.type as Block, task: qItem.task, queue: nextQ, running: true, targetMs: target, pausedLeftMs: null };
                } else {
                    const dur = (p.durations[qItem.type as Block] || [25, 5])[0] * 60000;
                    return { ...p, mode: "w", block: qItem.type as Block, task: qItem.task, queue: nextQ, running: true, targetMs: Date.now() + dur, pausedLeftMs: null };
                }
            } else {
                const [w] = p.durations[p.block as Block] || [10, 2];
                return { ...p, mode: "w", running: false, targetMs: null, pausedLeftMs: w * 60000, task: "" };
            }
        }),
        next: () => set(p => ({ ...p, theme: (p.theme + 1) % T.length })),
        setBlock: (b) => set(p => ({ ...p, block: b, mode: "w", running: false, targetMs: null, pausedLeftMs: p.durations[b][0] * 60000 })),
        setTask: (t) => set(p => ({ ...p, task: t })),
        setQueue: (q) => set(p => ({ ...p, queue: q })),
        setDuration: (b, w, br) => set(p => ({ ...p, durations: { ...p.durations, [b]: [w, br] } }))
    };

    return <C.Provider value={v}>{children}</C.Provider>;
}

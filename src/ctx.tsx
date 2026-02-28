import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "./themes";

const K = "pomo-state", HK = "pomo-history";
const BLOCKS = { mini: [10, 2], normal: [25, 5], deep: [50, 10] } as const;
export type Block = keyof typeof BLOCKS;
export const BLOCK_NAMES: Block[] = ["mini", "normal", "deep"];

type Entry = { task: string; block: Block; at: number };
type S = { theme: number; seconds: number; running: boolean; mode: "w" | "b"; block: Block; task: string };
const def: S = { theme: 0, seconds: BLOCKS.normal[0] * 60, running: false, mode: "w", block: "normal", task: "" };
const load = (): S => { try { return { ...def, ...JSON.parse(localStorage.getItem(K)!) }; } catch { return def; } };
const loadH = (): Entry[] => { try { return JSON.parse(localStorage.getItem(HK)!) || []; } catch { return []; } };

type Ctx = S & { history: Entry[]; toggle: () => void; reset: () => void; next: () => void; setBlock: (b: Block) => void; setTask: (t: string) => void };
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
    const [s, set] = useState(load);
    const [history, setHistory] = useState(loadH);
    const ref = useRef(s);
    ref.current = s;

    useEffect(() => { localStorage.setItem(K, JSON.stringify(s)); }, [s]);
    useEffect(() => { localStorage.setItem(HK, JSON.stringify(history)); }, [history]);

    useEffect(() => {
        if (!s.running) return;
        const id = setInterval(() => {
            const c = ref.current;
            if (c.seconds <= 1) {
                if (c.mode === "w") setHistory(h => [{ task: c.task || "Untitled", block: c.block, at: Date.now() }, ...h].slice(0, 50));
                const next = c.mode === "w" ? "b" : "w";
                const [w, b] = BLOCKS[c.block];
                set({ ...c, seconds: (next === "w" ? w : b) * 60, mode: next, running: false });
            } else set({ ...c, seconds: c.seconds - 1 });
        }, 1000);
        return () => clearInterval(id);
    }, [s.running]);

    useEffect(() => {
        const r = document.documentElement;
        const t = T[s.theme];
        Object.entries(t.v).forEach(([k, v]) => r.style.setProperty(k, v));
        r.className = t.cls;
    }, [s.theme]);

    const v: Ctx = {
        ...s, history,
        toggle: () => set(p => ({ ...p, running: !p.running })),
        reset: () => set(p => ({ ...p, seconds: BLOCKS[p.block][p.mode === "w" ? 0 : 1] * 60, running: false })),
        next: () => set(p => ({ ...p, theme: (p.theme + 1) % T.length })),
        setBlock: (b) => set(p => ({ ...p, block: b, seconds: BLOCKS[b][0] * 60, mode: "w", running: false })),
        setTask: (t) => set(p => ({ ...p, task: t })),
    };

    return <C.Provider value={v}>{children}</C.Provider>;
}

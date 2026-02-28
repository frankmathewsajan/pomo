import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "./themes";

const K = "pomo-state";
const WORK = 25 * 60, BREAK = 5 * 60;

type S = { theme: number; seconds: number; running: boolean; mode: "w" | "b" };
const def: S = { theme: 0, seconds: WORK, running: false, mode: "w" };
const load = (): S => { try { return { ...def, ...JSON.parse(localStorage.getItem(K)!) }; } catch { return def; } };

type Ctx = S & { toggle: () => void; reset: () => void; next: () => void };
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
    const [s, set] = useState(load);
    const ref = useRef(s);
    ref.current = s;

    useEffect(() => { localStorage.setItem(K, JSON.stringify(s)); }, [s]);

    useEffect(() => {
        if (!s.running) return;
        const id = setInterval(() => {
            const c = ref.current;
            if (c.seconds <= 1) {
                const next = c.mode === "w" ? "b" : "w";
                set({ ...c, seconds: next === "w" ? WORK : BREAK, mode: next, running: false });
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
        ...s,
        toggle: () => set(p => ({ ...p, running: !p.running })),
        reset: () => set(p => ({ ...p, seconds: p.mode === "w" ? WORK : BREAK, running: false })),
        next: () => set(p => ({ ...p, theme: (p.theme + 1) % T.length })),
    };

    return <C.Provider value={v}>{children}</C.Provider>;
}

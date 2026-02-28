import { AppProvider, useApp } from "./ctx";
import Timer from "./Timer";
import { T } from "./themes";
import { useState } from "react";

function History() {
    const { history } = useApp();
    const [open, setOpen] = useState(false);
    if (!history.length) return null;
    return (
        <div className="w-full max-w-xs">
            <button className="pill w-full" onClick={() => setOpen(!open)}>History ({history.length})</button>
            {open && (
                <ul className="hist mt-2">
                    {history.map((e, i) => (
                        <li key={i} className="hist-item">
                            <span className="truncate flex-1">{e.task}</span>
                            <span className="opacity-50 text-xs">{e.block} · {new Date(e.at).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Chrome() {
    const { theme, next } = useApp();
    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
            <div data-tauri-drag-region className="titlebar flex items-center justify-between px-4 py-2 select-none">
                <span className="text-sm font-bold opacity-60">pomo</span>
                <div className="flex gap-1">
                    <button className="wb" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().minimize()}>─</button>
                    <button className="wb close" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().close()}>✕</button>
                </div>
            </div>
            <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto">
                <Timer />
                <div className="flex gap-2">
                    <button className="pill" onClick={next}>{T[theme].name}</button>
                </div>
                <History />
            </main>
        </div>
    );
}

export default function App() {
    return <AppProvider><Chrome /></AppProvider>;
}

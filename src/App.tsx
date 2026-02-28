import { AppProvider, useApp } from "./ctx";
import Timer from "./Timer";
import { T } from "./themes";

function Chrome() {
    const { theme, next } = useApp();
    return (
        <div className="h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
            <div data-tauri-drag-region className="titlebar flex items-center justify-between px-4 py-2 select-none">
                <span className="text-sm font-bold opacity-60">pomo</span>
                <div className="flex gap-1">
                    <button className="wb" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().minimize()}>─</button>
                    <button className="wb close" onClick={() => (window as any).__TAURI__?.window?.getCurrentWindow().close()}>✕</button>
                </div>
            </div>
            <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
                <Timer />
                <button className="pill" onClick={next}>{T[theme].name}</button>
            </main>
        </div>
    );
}

export default function App() {
    return <AppProvider><Chrome /></AppProvider>;
}

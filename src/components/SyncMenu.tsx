import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import GlobalTagsEditor from "./sync/GlobalTagsEditor";

export default function SyncMenu() {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = () => {
    const state = localStorage.getItem("pomo-state");
    const history = localStorage.getItem("pomo-history");
    const data = {
      state: state ? JSON.parse(state) : null,
      history: history ? JSON.parse(history) : null,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pomo-export-${new Date().toISOString().split("T")[0]}.json`;
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
      } catch {
        alert("Invalid configuration file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shadow-sm cursor-pointer" onClick={() => setOpen(!open)} title="Sync / Config">
        <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-4 w-52 rounded-sm shadow-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-ring)", padding: "4px" }}>
          <div className="flex flex-col text-[13px] font-medium opacity-90">
            <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors" onClick={handleExport}>Export Config (JSON)</button>
            <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors mt-1" onClick={handleImportClick}>Import Config (JSON)</button>
            <div className="px-4 py-2 border-t mt-1 border-black/5 flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors" onClick={toggleWaitEnabled}>
              <span>Wait function</span>
              <span className="font-bold opacity-70">{waitEnabled ? "ON" : "OFF"}</span>
            </div>
            <div className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors" onClick={toggleAdvancedNotes}>
              <span>Advanced Notes</span>
              <span className="font-bold opacity-70">{advancedNotes ? "ON" : "OFF"}</span>
            </div>
            <GlobalTagsEditor />
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />

      {exportNotice && <div className="absolute bottom-1/2 left-16 shrink-0 w-[240px] px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold bg-green-500/10 text-green-700 border border-green-500/20 backdrop-blur-md animate-fade-in z-50 pointer-events-none">{exportNotice}</div>}
    </div>
  );
}

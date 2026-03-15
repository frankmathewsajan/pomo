import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import GlobalTagsEditor from "./sync/GlobalTagsEditor";

export default function SyncMenu() {
  const { waitEnabled, toggleWaitEnabled, advancedNotes, toggleAdvancedNotes, exportConfig, importConfig } = useApp();
  const [open, setOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
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

  const handleExport = async () => {
    try {
      const path = await saveDialog({
        defaultPath: `pomo-export-${new Date().toISOString().split("T")[0]}.json`,
        filters: [{ name: "Config", extensions: ["json"] }],
      });
      if (!path) return;

      const data = await exportConfig();
      await writeTextFile(path, JSON.stringify(data, null, 2));
      setOpen(false);
      setExportNotice(`Saved: ${path.split(/[\\/]/).pop() || "config.json"}`);
      setTimeout(() => setExportNotice(null), 3500);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export configuration.");
    }
  };

  const handleImport = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        filters: [{ name: "Config", extensions: ["json"] }],
      });

      if (typeof selected !== "string") return;
      const contents = await readTextFile(selected);
      const parsed = JSON.parse(contents) as { state?: unknown; history?: unknown };
      await importConfig(parsed);
      setOpen(false);
      setExportNotice("Configuration imported.");
      setTimeout(() => setExportNotice(null), 2500);
    } catch (error) {
      console.error("Import failed", error);
      alert("Invalid configuration file");
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button className="size-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shadow-sm cursor-pointer" onClick={() => setOpen(!open)} title="Settings" aria-label="Settings">
        <svg className="size-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.196 1.188c.516.14 1.008.345 1.465.607l.995-.68a1.125 1.125 0 011.454.126l.773.773c.39.39.438 1.004.126 1.454l-.68.995c.262.457.467.95.607 1.465l1.188.196c.542.09.94.56.94 1.11v1.094c0 .55-.398 1.02-.94 1.11l-1.188.196a6.844 6.844 0 01-.607 1.465l.68.995c.312.45.264 1.063-.126 1.454l-.773.773a1.125 1.125 0 01-1.454.126l-.995-.68a6.844 6.844 0 01-1.465.607l-.196 1.188c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.196-1.188a6.844 6.844 0 01-1.465-.607l-.995.68a1.125 1.125 0 01-1.454-.126l-.773-.773a1.125 1.125 0 01-.126-1.454l.68-.995a6.844 6.844 0 01-.607-1.465l-1.188-.196a1.125 1.125 0 01-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l1.188-.196c.14-.516.345-1.008.607-1.465l-.68-.995a1.125 1.125 0 01.126-1.454l.773-.773a1.125 1.125 0 011.454-.126l.995.68c.457-.262.95-.467 1.465-.607l.196-1.188z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-4 w-52 rounded-sm shadow-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-ring)", padding: "4px" }}>
          <div className="flex flex-col text-[13px] font-medium opacity-90">
            <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors" onClick={handleExport}>Export Config (JSON)</button>
            <button className="w-full text-left px-4 py-2.5 rounded hover:bg-black/5 transition-colors mt-1" onClick={handleImport}>Import Config (JSON)</button>
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

      {exportNotice && <div className="absolute bottom-1/2 left-16 shrink-0 w-60 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold bg-green-500/10 text-green-700 border border-green-500/20 backdrop-blur-md animate-fade-in z-50 pointer-events-none">{exportNotice}</div>}
    </div>
  );
}

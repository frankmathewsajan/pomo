import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

type ActivitySidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function ActivitySidebar({ isOpen, onToggle }: ActivitySidebarProps) {
  const { history } = useApp();
  const [filter, setFilter] = useState<"all" | "completed" | "early" | "abandoned">("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(
    () =>
      history.filter((h) => {
        if (filter !== "all" && h.status !== filter) return false;
        if (dateFilter && new Date(h.at).toLocaleDateString("en-CA") !== dateFilter) return false;
        return true;
      }),
    [history, filter, dateFilter]
  );

  const groupedFiltered = useMemo(
    () => {
      type GroupedEntry = (typeof history)[number] & { count: number };
      return filtered.reduce<GroupedEntry[]>((acc, current) => {
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
    },
    [filtered]
  );

  if (!isOpen) {
    return (
      <div className="h-full border-r flex flex-col items-center justify-center py-6 bg-card shrink-0 cursor-pointer hover:bg-black/5 transition-colors" style={{ width: "56px", borderColor: "var(--border-ring)" }} onClick={onToggle}>
        <span className="opacity-50 text-[11px] uppercase font-bold tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          Activity
        </span>
      </div>
    );
  }

  return (
    <div className="w-80 border-r flex flex-col h-full bg-card overflow-hidden shrink-0" style={{ background: "var(--card)", borderColor: "var(--border-ring)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
      <div className="shrink-0 flex flex-col gap-4 border-b" style={{ padding: "1.25rem", borderColor: "var(--border-ring)" }}>
        <div className="flex justify-between items-center">
          <h2 className="label m-0" style={{ opacity: 0.9 }}>Activity & History</h2>
          <button className="wb size-6 rounded hover:bg-black/10" onClick={onToggle}>◀</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className={`pill px-3 py-1 text-xs ${filter === "all" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("all")}>All</button>
          <button className={`pill px-3 py-1 text-xs ${filter === "completed" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("completed")}>Done</button>
          <button className={`pill px-3 py-1 text-xs ${filter === "early" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("early")}>Early</button>
          <button className={`pill px-3 py-1 text-xs ${filter === "abandoned" ? "opacity-100 ring-2 ring-black/10" : "opacity-50"}`} onClick={() => setFilter("abandoned")}>Wait drops</button>
        </div>

        <div className="relative w-full flex items-center group">
          <input type="date" className="task-input w-full px-4 py-2 text-xs font-semibold h-10 border-none bg-black/5 focus:bg-white focus:ring-2 focus:ring-black/10 rounded-lg shadow-inner transition-all max-w-none" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          {dateFilter && <button className="absolute right-2 wb size-6 opacity-60 hover:opacity-100 shrink-0 bg-white rounded shadow-sm border border-black/5" title="Clear Date" onClick={() => setDateFilter("")}>✕</button>}
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: "1.25rem" }}>
        {groupedFiltered.map((h, i) => (
          <div key={i} className={`hist-item relative text-left flex flex-col items-start gap-1 p-4 rounded transition-colors hover:bg-black/5 shrink-0 ${h.status === "abandoned" ? "opacity-50" : ""}`} style={{ border: "1px solid var(--border-ring)" }}>
            <div className="flex justify-between w-full items-center">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <span className={`font-semibold text-sm truncate ${h.status === "abandoned" ? "line-through" : ""}`}>{h.task || "Untitled"}</span>
                {h.count > 1 && <span className="text-[10px] font-bold opacity-60 bg-black/5 px-1.5 py-0.5 rounded-full shrink-0">x{h.count}</span>}
              </div>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${h.status === "early" ? "bg-red-500/10 text-red-600" : h.status === "abandoned" ? "bg-zinc-500/10 text-zinc-500" : h.status === "micro-task" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-600"}`}>
                {h.status}
              </span>
            </div>
            <span className="opacity-60 text-[10px] font-bold uppercase tracking-wider">{h.block} • {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        ))}
        {groupedFiltered.length === 0 && <p className="text-[13px] opacity-50 text-center py-6">No history found.</p>}
      </div>
    </div>
  );
}

import { useRef, useState, type KeyboardEvent } from "react";
import { useApp } from "../context/AppContext";
import { type Block } from "../types";
import { useQueueScheduler } from "../hooks/useQueueScheduler";
import AddBlockForm from "./queue/AddBlockForm";
import QueueItem from "./queue/QueueItem";
import TrashList from "./queue/TrashList";
import { createQueueEditState, createQueueFormState, type QueueEditState, type QueueFormState } from "./queue/shared";

type QueueSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function QueueSidebar({ isOpen, onToggle }: QueueSidebarProps) {
  const { queue, setQueue, mode, block, durations, advancedNotes, trash, restoreTask, removeTask, emptyTrash, globalTags, targetMs, pausedLeftMs, running } = useApp();
  const [draft, setDraft] = useState<QueueFormState>(() => createQueueFormState());
  const editNotesRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState<QueueEditState | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const scheduled = useQueueScheduler({ queue, durations, mode, block, running, targetMs, pausedLeftMs, showArchived, showRecurring });

  const updateDraft = (updater: (current: QueueFormState) => QueueFormState) => setDraft((current) => updater(current));
  const updateEditing = (updater: (current: QueueEditState) => QueueEditState) => setEditing((current) => (current ? updater(current) : current));

  const addQueue = () => {
    if (!draft.task.trim()) return;
    setQueue([
      ...queue,
      {
        id: Math.random().toString(36).substring(7),
        type: draft.type,
        task: draft.task,
        idleTime: draft.isIdle ? draft.idleTime : undefined,
        isIdle: draft.isIdle,
        recurring: draft.recurring,
        recurringOption: draft.recurring ? draft.recurringOption : undefined,
        recurringDays: draft.recurring && draft.recurringOption === "weekly" ? draft.recurringDays : undefined,
        notes: draft.notes.trim() || undefined,
        createdAt: Date.now(),
        tags: draft.tags.length > 0 ? draft.tags : undefined,
      },
    ]);
    setDraft(createQueueFormState());
  };

  const swapInQueue = (id: string, dir: -1 | 1) => {
    const vi = scheduled.resolvedQueue.findIndex((q) => q.id === id);
    const ti = vi + dir;
    if (ti < 0 || ti >= scheduled.resolvedQueue.length) return;
    const qi1 = queue.findIndex((q) => q.id === id);
    const qi2 = queue.findIndex((q) => q.id === scheduled.resolvedQueue[ti].id);
    const next = [...queue];
    [next[qi1], next[qi2]] = [next[qi2], next[qi1]];
    setQueue(next);
  };

  const startEditing = (q: (typeof queue)[number]) => {
    setEditing(createQueueEditState(q));
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.task.trim()) {
      setEditing(null);
      return;
    }
    setQueue(
      queue.map((q) =>
        q.id === editing.id
          ? {
              ...q,
              task: editing.task,
              notes: editing.notes.trim() || undefined,
              type: editing.type,
              idleTime: editing.isIdle ? editing.idleTime : undefined,
              isIdle: editing.isIdle,
              recurring: editing.recurring,
              recurringOption: editing.recurring ? editing.recurringOption : undefined,
              recurringDays: editing.recurring && editing.recurringOption === "weekly" ? editing.recurringDays : undefined,
              tags: editing.tags.length > 0 ? editing.tags : undefined,
            }
          : q
      )
    );
    setEditing(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editing?.id === id) saveEdit();
    }
    if (e.key === "Escape") setEditing(null);
  };

  if (!isOpen) {
    return (
      <div className="h-full border-l flex flex-col items-center justify-center py-6 bg-card shrink-0 cursor-pointer hover:bg-black/5 transition-colors" style={{ width: "56px", borderColor: "var(--border-ring)" }} onClick={onToggle}>
        <span className="opacity-50 text-[11px] uppercase font-bold tracking-widest" style={{ writingMode: "vertical-rl" }}>Queue</span>
      </div>
    );
  }

  return (
    <div className="w-80 border-l flex flex-col h-full bg-card overflow-hidden shrink-0" style={{ background: "var(--card)", borderColor: "var(--border-ring)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
      <div className="border-b shrink-0 flex justify-between items-center" style={{ padding: "1rem 1.25rem", borderColor: "var(--border-ring)" }}>
        <div className="flex items-center gap-3">
          <button className="wb w-6 h-6 rounded hover:bg-black/10" onClick={onToggle}>▶</button>
          <h2 className="label m-0!" style={{ opacity: 0.9 }}>Up Next</h2>
        </div>
        <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{queue.filter((q) => !q.archived).length} items</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1" style={{ padding: "1.25rem" }}>
        {(() => {
          if (showTrash) {
            return <TrashList trash={trash} onRestore={restoreTask} onEmpty={emptyTrash} onClose={() => setShowTrash(false)} />;
          }

          const { canHide, resolvedQueue, resolvedMap, realNow } = scheduled;

          if (resolvedQueue.length === 0 && !showArchived) {
            return (
              <div className="flex flex-col">
                {canHide && (
                  <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mb-1 w-full" onClick={() => setShowRecurring(!showRecurring)}>
                    {showRecurring ? "Hide Recurring" : "Show Recurring"}
                    <span className="text-[8px]">{showRecurring ? "▲" : "▼"}</span>
                  </button>
                )}
                <p className="text-[13px] opacity-50 text-center py-6">Your queue is empty.</p>
              </div>
            );
          }

          return (
            <>
              {canHide && (
                <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mb-1 w-full" onClick={() => setShowRecurring(!showRecurring)}>
                  {showRecurring ? "Hide Recurring" : "Show Recurring"}
                  <span className="text-[8px]">{showRecurring ? "▲" : "▼"}</span>
                </button>
              )}
              {resolvedQueue.map((q, i) => {
                const res = resolvedMap.get(q.id)!;
                const startInfoStr = res.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + (q.idleTime ? " " + res.start.toLocaleDateString([], { month: "short", day: "numeric" }) : "");
                const endInfoStr = res.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + (q.idleTime ? " " + res.end.toLocaleDateString([], { month: "short", day: "numeric" }) : "");
                return (
                  <QueueItem
                    key={q.id}
                    item={q}
                    index={i}
                    total={resolvedQueue.length}
                    advancedNotes={advancedNotes}
                    globalTags={globalTags}
                    durations={durations as Record<Block, readonly [number, number]>}
                    realNow={realNow}
                    startInfo={startInfoStr}
                    endInfo={endInfoStr}
                    editing={editing?.id === q.id ? editing : null}
                    editNotesRef={editNotesRef}
                    onMove={swapInQueue}
                    onStartEdit={startEditing}
                    onEditChange={updateEditing}
                    onSave={saveEdit}
                    onCancel={() => setEditing(null)}
                    onArchiveToggle={(id) => setQueue(queue.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x)))}
                    onRemove={removeTask}
                    onEditKeyDown={handleEditKeyDown}
                  />
                );
              })}

              <div className="pt-2 border-t border-(--border-ring) flex justify-between items-center w-full mt-2 px-1">
                <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" onClick={() => setShowArchived(!showArchived)}>
                  {showArchived ? "Back to Queue" : `View Archive (${queue.filter((q) => q.archived).length})`}
                </button>
                <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" onClick={() => setShowTrash(true)} title="View Deleted Tasks">
                  Trash ({trash.length})
                </button>
              </div>
            </>
          );
        })()}
      </div>

      <AddBlockForm advancedNotes={advancedNotes} globalTags={globalTags} value={draft} onChange={updateDraft} onSubmit={addQueue} />
    </div>
  );
}

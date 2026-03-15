import type { KeyboardEvent, RefObject } from "react";
import { BLOCK_NAMES, type Block, type QueuedBlock, type RecurringOption } from "../../types";
import RichTextToolbar from "../RichTextToolbar";
import TagPicker from "../TagPicker";
import Toggle from "../Toggle";
import { WEEKDAY_LABELS, type QueueEditState } from "./shared";

type QueueItemProps = {
  item: QueuedBlock;
  index: number;
  total: number;
  advancedNotes: boolean;
  globalTags: string[];
  durations: Record<Block, readonly [number, number]>;
  realNow: Date;
  startInfo: string;
  endInfo: string;
  editing: QueueEditState | null;
  editNotesRef: RefObject<HTMLTextAreaElement | null>;
  onMove: (id: string, direction: -1 | 1) => void;
  onStartEdit: (item: QueuedBlock) => void;
  onEditChange: (updater: (current: QueueEditState) => QueueEditState) => void;
  onSave: () => void;
  onCancel: () => void;
  onArchiveToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEditKeyDown: (event: KeyboardEvent, id: string) => void;
};

export default function QueueItem({
  item,
  index,
  total,
  advancedNotes,
  globalTags,
  durations,
  realNow,
  startInfo,
  endInfo,
  editing,
  editNotesRef,
  onMove,
  onStartEdit,
  onEditChange,
  onSave,
  onCancel,
  onArchiveToggle,
  onRemove,
  onEditKeyDown,
}: QueueItemProps) {
  const isEditing = editing?.id === item.id;
  const isScheduled = Boolean(item.idleTime);
  const isOldTask = !isScheduled && !item.recurring && item.createdAt ? realNow.getTime() - item.createdAt > 86400000 : false;

  return (
    <div className="hist-item relative group text-left flex flex-col justify-between gap-3 p-4 rounded transition-colors hover:bg-black/5 shrink-0" style={{ border: `1px ${isScheduled ? "double" : "solid"} ${isOldTask ? "rgba(239, 68, 68, 0.4)" : "var(--border-ring)"}`, borderWidth: isScheduled ? "3px" : "1px" }}>
      <div className="absolute top-2 right-2 flex items-center bg-(--card)/90 backdrop-blur-md rounded-md shadow-sm border border-(--border-ring) opacity-0 group-hover:opacity-100 transition-opacity z-10 px-1 py-1">
        <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" title="Move up" disabled={index <= 0} onClick={() => onMove(item.id, -1)}>↑</button>
        <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded hover:bg-black/10" title="Move down" disabled={index >= total - 1} onClick={() => onMove(item.id, 1)}>↓</button>
        {!isEditing && <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-black/10 transition-colors" title="Edit" onClick={() => onStartEdit(item)}>✎</button>}
        <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-black/10 transition-colors" title={item.archived ? "Unarchive" : "Archive"} aria-label={`${item.archived ? "Unarchive" : "Archive"} ${item.task}`} onClick={() => onArchiveToggle(item.id)}>{item.archived ? "⇧" : "⇩"}</button>
        <button className="wb w-6 h-6 flex items-center justify-center p-0 rounded ml-1 hover:bg-red-500 hover:text-white" title="Delete" aria-label={`Delete ${item.task}`} onClick={() => onRemove(item.id)}>✕</button>
      </div>

      <div className="flex justify-between w-full items-start gap-4 pr-1">
        <div className="flex-1 font-bold text-[14px] sm:text-[15px] leading-tight text-left cursor-text select-none text-(--text)" style={{ wordBreak: "break-word", minHeight: "1.5rem" }}>
          {isEditing && editing ? (
            <div className="flex flex-col gap-2 w-full pr-8">
              <input className="task-input w-full text-sm font-semibold p-1! -ml-1 h-auto" value={editing.task} onChange={(event) => onEditChange((current) => ({ ...current, task: event.target.value }))} onKeyDown={(event) => onEditKeyDown(event, item.id)} autoFocus />
              {advancedNotes && <div className="-ml-1"><RichTextToolbar textareaRef={editNotesRef} value={editing.notes} onChange={(notes) => onEditChange((current) => ({ ...current, notes }))} /></div>}
              <textarea
                ref={editNotesRef}
                className={`task-input w-full text-xs font-normal p-1! -ml-1 h-auto resize-none min-h-15 ${advancedNotes ? "bg-black/5 rounded-b-md rounded-t-none border-t-0" : "bg-transparent"}`}
                value={editing.notes}
                onChange={(event) => onEditChange((current) => ({ ...current, notes: event.target.value }))}
                onKeyDown={(event) => onEditKeyDown(event, item.id)}
                placeholder="Notes (HTML supported)..."
              />

              <div className="flex gap-1 w-full -ml-1 mt-1">
                {BLOCK_NAMES.map((block) => (
                  <button
                    key={block}
                    className="pill flex-1 px-1! py-1!"
                    style={{
                      backgroundColor: editing.type === block ? "var(--accent)" : "transparent",
                      color: editing.type === block ? "#ffffff" : "var(--text)",
                      border: "1px solid var(--border-ring)",
                      opacity: editing.type === block ? 1 : 0.6,
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                    onClick={() => onEditChange((current) => ({ ...current, type: block }))}
                  >
                    {block}
                  </button>
                ))}
              </div>

              <div className="-ml-1">
                <TagPicker tags={globalTags} selected={editing.tags} onChange={(tags) => onEditChange((current) => ({ ...current, tags }))} />
              </div>

              <div className="flex items-center gap-3 mt-1 -ml-1">
                <Toggle on={editing.recurring} onToggle={() => onEditChange((current) => ({ ...current, recurring: !current.recurring }))} label="Recurring" />
                <Toggle on={editing.isIdle} onToggle={() => onEditChange((current) => ({ ...current, isIdle: !current.isIdle }))} label="Schedule" />
              </div>

              {editing.recurring && (
                <div className="flex flex-col gap-1 -ml-1 mt-1">
                  <select className="task-input text-[10px] font-bold w-full py-1! bg-white focus:ring-0 cursor-pointer" value={editing.recurringOption} onChange={(event) => onEditChange((current) => ({ ...current, recurringOption: event.target.value as RecurringOption }))}>
                    <option value="daily">Everyday</option>
                    <option value="alternate">Alternate Days</option>
                    <option value="weekdays">Weekdays (Tue-Sat)</option>
                    <option value="holidays">Holidays (Sun-Mon)</option>
                    <option value="weekly">Specific Days</option>
                  </select>
                  {editing.recurringOption === "weekly" && (
                    <div className="flex gap-1 justify-between px-1 mt-1">
                      {WEEKDAY_LABELS.map((day, dayIndex) => (
                        <button
                          key={day}
                          className={`w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center transition-colors ${editing.recurringDays.includes(dayIndex) ? "bg-(--accent) text-white" : "bg-black/10 opacity-50 hover:opacity-100 text-(--text)"}`}
                          onClick={() => onEditChange((current) => ({ ...current, recurringDays: current.recurringDays.includes(dayIndex) ? current.recurringDays.filter((item) => item !== dayIndex) : [...current.recurringDays, dayIndex].sort() }))}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editing.isIdle && <input type="datetime-local" className="task-input w-full -ml-1 px-2 py-1 h-8 text-xs bg-white rounded-lg mt-1 border-none shadow-sm" value={editing.idleTime} onChange={(event) => onEditChange((current) => ({ ...current, idleTime: event.target.value }))} />}

              <div className="flex gap-2 justify-start mt-2 mb-2 -ml-1">
                <button className="btn highlight py-1! px-3! text-[11px]! rounded" onClick={onSave}>Save</button>
                <button className="btn secondary py-1! px-3! text-[11px]! rounded" onClick={onCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full pb-1">
              <span>
                <span onClick={() => onStartEdit(item)}>{item.task}</span>
                {item.recurring && (
                  <span className="ml-1 inline-flex items-center justify-center align-middle mb-0.5 opacity-80" style={{ color: "var(--accent)" }} title="Recurring">
                    &nbsp;
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                )}
              </span>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-black/10 transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent)", color: "white", opacity: 0.8 }} onClick={() => onStartEdit(item)}>{tag}</span>
                  ))}
                </div>
              )}
              {item.notes && <div className="text-xs opacity-70 mt-1.5 font-normal leading-relaxed overflow-hidden notes-content" dangerouslySetInnerHTML={{ __html: item.notes }} onClick={() => onStartEdit(item)} />}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right mt-0.5">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">{item.type} ({(durations[item.type] || [25, 5])[0]}m)</span>
        </div>
      </div>

      <div className="flex justify-between w-full items-end mt-1">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">~{startInfo}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">~{endInfo}</span>
      </div>
    </div>
  );
}
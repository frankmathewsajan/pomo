import { useRef } from "react";
import { BLOCK_NAMES, type RecurringOption } from "../../types";
import RichTextToolbar from "../RichTextToolbar";
import TagPicker from "../TagPicker";
import Toggle from "../Toggle";
import { WEEKDAY_LABELS, type QueueFormState } from "./shared";

type AddBlockFormProps = {
  advancedNotes: boolean;
  globalTags: string[];
  value: QueueFormState;
  onChange: (updater: (current: QueueFormState) => QueueFormState) => void;
  onSubmit: () => void;
};

export default function AddBlockForm({ advancedNotes, globalTags, value, onChange, onSubmit }: AddBlockFormProps) {
  const notesRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="border-t flex flex-col gap-3 shrink-0 bg-black/5" style={{ padding: "1.25rem", borderColor: "var(--border-ring)" }}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Add block</p>

      <input
        className="task-input w-full text-left! px-4 py-2 text-sm max-w-none border-none bg-white rounded-lg shadow-sm mb-3"
        placeholder="Task name..."
        value={value.task}
        onChange={(event) => onChange((current) => ({ ...current, task: event.target.value }))}
      />

      {advancedNotes && <RichTextToolbar textareaRef={notesRef} value={value.notes} onChange={(notes) => onChange((current) => ({ ...current, notes }))} />}
      <textarea
        ref={notesRef}
        className={`task-input w-full text-left! px-4 py-2 text-xs max-w-none bg-white shadow-sm mb-3 resize-none min-h-12 ${advancedNotes ? "border-t-0 rounded-b-lg" : "border-none rounded-lg"}`}
        placeholder="Notes (HTML supported)..."
        value={value.notes}
        onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
      />

      <div className="flex gap-2 w-full">
        {BLOCK_NAMES.map((block) => (
          <button
            key={block}
            className="pill flex-1 px-2! py-2! transition-all duration-200"
            style={{
              backgroundColor: value.type === block ? "var(--accent)" : "transparent",
              color: value.type === block ? "#ffffff" : "var(--text)",
              border: "1px solid var(--border-ring)",
              opacity: value.type === block ? 1 : 0.6,
              transform: value.type === block ? "scale(1.05)" : "none",
              fontWeight: "bold",
              textTransform: "capitalize",
              fontSize: "0.75rem",
            }}
            onClick={() => onChange((current) => ({ ...current, type: block }))}
          >
            {block}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-2">
        <Toggle on={value.recurring} onToggle={() => onChange((current) => ({ ...current, recurring: !current.recurring }))} label="Recurring" />
        <Toggle on={value.isIdle} onToggle={() => onChange((current) => ({ ...current, isIdle: !current.isIdle }))} label="Schedule" />
      </div>

      <TagPicker tags={globalTags} selected={value.tags} onChange={(tags) => onChange((current) => ({ ...current, tags }))} />

      {value.recurring && (
        <div className="flex flex-col gap-2 mt-2 bg-white/5 p-2 rounded-lg border border-black/5">
          <select
            className="task-input text-xs font-bold w-full py-1.5! focus:ring-0 cursor-pointer bg-white"
            value={value.recurringOption}
            onChange={(event) => onChange((current) => ({ ...current, recurringOption: event.target.value as RecurringOption }))}
          >
            <option value="daily">Everyday</option>
            <option value="alternate">Alternate Days</option>
            <option value="weekdays">Weekdays (Tue-Sat)</option>
            <option value="holidays">Holidays (Sun-Mon)</option>
            <option value="weekly">Specific Days</option>
          </select>

          {value.recurringOption === "weekly" && (
            <div className="flex gap-1 justify-between px-1 mt-1">
              {WEEKDAY_LABELS.map((day, index) => (
                <button
                  key={day}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${value.recurringDays.includes(index) ? "bg-(--accent) text-white" : "bg-black/10 opacity-50 hover:opacity-100 text-(--text)"}`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      recurringDays: current.recurringDays.includes(index)
                        ? current.recurringDays.filter((item) => item !== index)
                        : [...current.recurringDays, index].sort(),
                    }))
                  }
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {value.isIdle && (
        <input
          type="datetime-local"
          className="task-input flex-1 px-4 py-2 h-10 text-sm max-w-none shadow-sm border-none bg-white rounded-lg mt-2"
          value={value.idleTime}
          onChange={(event) => onChange((current) => ({ ...current, idleTime: event.target.value }))}
        />
      )}

      <button className="btn w-full py-3 mt-1 font-semibold tracking-wide rounded-lg bg-black text-white shadow-md hover:opacity-90 transition-all border-none" onClick={onSubmit}>
        + Add to Queue
      </button>
    </div>
  );
}
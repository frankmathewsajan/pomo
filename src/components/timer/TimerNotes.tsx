import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { isDueNow } from "../../utils/queueTime";
import RichTextToolbar from "../RichTextToolbar";

export default function TimerNotes() {
  const { mode, running, task, notes, advancedNotes, setTask, setNotes, queue, chooseFromQueue, rouletteQueuePick } = useApp();
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(notes || "");
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  const isWait = mode === "wait";

  useEffect(() => {
    setTempNotes(notes || "");
  }, [notes]);

  const queueChoices = useMemo(() => queue.filter((q) => !q.archived && !q.recurring), [queue]);
  const rouletteChoices = useMemo(
    () => queueChoices.filter((q) => !q.idleTime || isDueNow(q.idleTime)),
    [queueChoices]
  );

  useEffect(() => {
    if (queueChoices.length === 0) {
      setSelectedQueueId("");
      return;
    }
    if (!queueChoices.some((q) => q.id === selectedQueueId)) {
      setSelectedQueueId(queueChoices[0].id);
    }
  }, [queueChoices, selectedQueueId]);

  const shouldShowQuickPick = mode === "w" && !running && !task.trim() && queueChoices.length > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-90 gap-1">
      <input className="task-input w-full text-center py-3" disabled={isWait} placeholder="Task name…" value={task} onChange={(e) => setTask(e.target.value)} />

      {shouldShowQuickPick && (
        <div className="w-full mt-1 p-2 rounded-lg border border-black/5 bg-black/5 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-55 text-center">Queue Actions</p>
          <select className="task-input w-full text-xs font-semibold py-2 bg-white" value={selectedQueueId} onChange={(e) => setSelectedQueueId(e.target.value)}>
            {queueChoices.map((q) => {
              const scheduled = !!q.idleTime;
              const due = q.idleTime ? isDueNow(q.idleTime) : true;
              return <option key={q.id} value={q.id}>{q.task} ({q.type}){scheduled ? due ? " • scheduled (due)" : " • scheduled" : ""}</option>;
            })}
          </select>
          <div className="flex gap-2">
            <button className="btn secondary flex-1 text-xs py-2" disabled={!selectedQueueId} onClick={() => selectedQueueId && chooseFromQueue(selectedQueueId)}>Choose Task</button>
            <button className="btn highlight flex-1 text-xs py-2 disabled:opacity-50" disabled={rouletteChoices.length === 0} onClick={rouletteQueuePick} title="Scheduled tasks are excluded until their due time.">Roulette Pick</button>
          </div>
        </div>
      )}

      {(mode === "w" || isWait) && (
        <div className="w-full text-center mt-1 text-sm">
          {editingNotes ? (
            <div
              ref={notesContainerRef}
              className="flex flex-col w-full relative group"
              onBlur={(e) => {
                if (!notesContainerRef.current?.contains(e.relatedTarget as Node)) {
                  setNotes(tempNotes);
                  setEditingNotes(false);
                }
              }}
            >
              {advancedNotes && <RichTextToolbar textareaRef={notesRef} value={tempNotes} onChange={setTempNotes} />}
              <textarea
                ref={notesRef}
                autoFocus
                className={`task-input w-full p-2 text-xs font-normal resize-none min-h-15 bg-black/5 ${advancedNotes ? "rounded-b-md rounded-t-none border-t-0" : "rounded-md"}`}
                placeholder="Task notes (HTML supported)..."
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
              />
              <div className="flex justify-end items-center mt-1 px-1">
                <button type="button" className="text-[10px] font-bold opacity-60 hover:opacity-100 bg-black/5 px-2 py-1 rounded" onClick={() => { setNotes(tempNotes); setEditingNotes(false); }}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs opacity-60 font-normal leading-relaxed min-h-5 w-full hover:bg-black/5 rounded transition-colors p-1 notes-content overflow-hidden text-center flex flex-col items-center" onClick={() => { if (!isWait) setEditingNotes(true); }} style={{ cursor: isWait ? "default" : "text" }}>
              {notes ? <div dangerouslySetInnerHTML={{ __html: notes }} className="w-full" style={{ textAlign: "center" }} /> : <i>Click to add notes...</i>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

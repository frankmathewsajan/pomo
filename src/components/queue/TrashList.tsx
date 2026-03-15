import type { QueuedBlock } from "../../types";

type TrashListProps = {
  trash: QueuedBlock[];
  onRestore: (id: string) => void;
  onEmpty: () => void;
  onClose: () => void;
};

export default function TrashList({ trash, onRestore, onEmpty, onClose }: TrashListProps) {
  if (trash.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[13px] opacity-50 text-center py-6">Trash is empty.</p>
        <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1 mt-4" onClick={onClose}>
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 m-0">Recently Deleted</h3>
        <button className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 opacity-80 hover:opacity-100" onClick={onEmpty}>
          Empty Trash
        </button>
      </div>
      {trash.map((item) => (
        <div key={item.id} className="hist-item relative group text-left flex justify-between gap-3 p-3 rounded transition-colors hover:bg-black/5 shrink-0 opacity-70 hover:opacity-100" style={{ border: "1px dashed var(--border-ring)" }}>
          <div className="flex flex-col gap-1 w-full overflow-hidden truncate">
            <span className="font-bold text-sm truncate">{item.task}</span>
            {item.notes && <span className="text-[10px] opacity-60 truncate">{item.notes}</span>}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.type}</span>
            <button className="px-2 py-1 text-[10px] uppercase font-bold bg-green-500 text-white rounded shadow-sm hover:bg-green-600 active:scale-95 transition-all" onClick={() => onRestore(item.id)}>
              Restore
            </button>
          </div>
        </div>
      ))}
      <div className="pt-4 flex justify-center w-full mt-auto">
        <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" onClick={onClose}>
          Back to Queue
        </button>
      </div>
    </>
  );
}
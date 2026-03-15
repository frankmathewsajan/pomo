import { memo } from "react";

type TagPickerProps = {
  tags: string[];
  selected: string[];
  onChange: (s: string[]) => void;
};

function TagPicker({ tags, selected, onChange }: TagPickerProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 bg-white/5 p-2 rounded-lg border border-black/5">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Tags</span>
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <button
            key={t}
            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded transition-all ${selected.includes(t) ? "bg-[var(--accent)] text-white" : "bg-black/10 text-[var(--text)] opacity-60 hover:opacity-100"}`}
            onClick={() => {
              if (selected.includes(t)) onChange(selected.filter((x) => x !== t));
              else onChange([...selected, t]);
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(TagPicker);

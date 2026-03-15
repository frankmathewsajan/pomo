import { memo, useState } from "react";
import { useApp } from "../../context/AppContext";

function GlobalTagsEditorInner() {
  const { globalTags, addGlobalTag, removeGlobalTag } = useApp();
  const [newTag, setNewTag] = useState("");

  const handleAddTags = () => {
    if (!newTag.trim()) return;
    newTag.split(",").forEach((tag) => {
      const t = tag.trim().toLowerCase();
      if (t) addGlobalTag(t);
    });
    setNewTag("");
  };

  return (
    <div className="px-4 py-3 border-t mt-1 border-black/5 flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Global Tags</span>
      <div className="flex flex-wrap gap-1">
        {globalTags.map((t) => (
          <span key={t} className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded transition-all bg-black/10 text-(--text) flex items-center gap-1 group">
            {t}
            <button className="opacity-40 hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); removeGlobalTag(t); }}>✕</button>
          </span>
        ))}
      </div>
      <input
        className="w-full px-2 py-1 text-xs bg-black/5 rounded focus:bg-white focus:ring-1 focus:ring-black/10 transition-colors border border-black/5 mt-1"
        placeholder="Type to add tags (comma sep)..."
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onBlur={handleAddTags}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newTag.trim()) {
            e.preventDefault();
            e.stopPropagation();
            handleAddTags();
          }
        }}
      />
    </div>
  );
}

const GlobalTagsEditor = memo(GlobalTagsEditorInner);
export default GlobalTagsEditor;

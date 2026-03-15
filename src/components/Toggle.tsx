import { memo } from "react";

type ToggleProps = {
  on: boolean;
  onToggle: () => void;
  label: string;
};

function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer w-fit select-none shrink-0 group" onClick={onToggle}>
      <div
        className="relative w-8 h-4 rounded-full transition-colors duration-300"
        style={{ backgroundColor: on ? "var(--accent)" : "transparent", border: "1px solid var(--border-ring)" }}
      >
        <div
          className={`absolute top-0.5 rounded-full shadow-sm transform transition-transform duration-300 ${on ? "translate-x-4" : "translate-x-0"}`}
          style={{ width: "10px", height: "10px", left: "2px", backgroundColor: on ? "#ffffff" : "var(--text)", opacity: on ? 1 : 0.7 }}
        />
      </div>
      <span className="text-[12px] font-bold tracking-wide uppercase opacity-70 group-hover:opacity-100 transition-opacity">{label}</span>
    </label>
  );
}

export default memo(Toggle);

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useApp } from "../../context/AppContext";

type WaitSetupState = {
  waitSetup: boolean;
  openSetup: () => void;
  closeSetup: () => void;
};

const WaitSetupCtx = createContext<WaitSetupState | null>(null);

export function WaitSetupProvider({ children }: { children: ReactNode }) {
  const [waitSetup, setWaitSetup] = useState(false);
  const value = useMemo(
    () => ({
      waitSetup,
      openSetup: () => setWaitSetup(true),
      closeSetup: () => setWaitSetup(false),
    }),
    [waitSetup]
  );

  return <WaitSetupCtx.Provider value={value}>{children}</WaitSetupCtx.Provider>;
}

export function useWaitSetup() {
  const ctx = useContext(WaitSetupCtx);
  if (!ctx) {
    throw new Error("useWaitSetup must be used within WaitSetupProvider");
  }
  return ctx;
}

export function WaitSetupForm() {
  const { startWait } = useApp();
  const { waitSetup, closeSetup } = useWaitSetup();
  const [waitInput, setWaitInput] = useState("");
  const [waitThresh, setWaitThresh] = useState<number>(5);

  if (!waitSetup) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[400px] bg-black/5 p-4 sm:p-6 rounded-2xl shadow-sm border border-black/5">
      <h3 className="text-md sm:text-lg font-bold tracking-tight">Pending Engagement</h3>
      <p className="text-xs opacity-70 text-center font-medium leading-relaxed">Task blocked? Enter a micro-task and max timeout.</p>
      <input className="task-input w-full text-center !py-3 bg-white" autoFocus placeholder="Micro-task name…" value={waitInput} onChange={(e) => setWaitInput(e.target.value)} />
      <div className="flex gap-2 w-full">
        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 5 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(5)}>5m Quick</button>
        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 10 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(10)}>10m Mini</button>
        <button className={`pill flex-1 !px-2 !py-2.5 font-bold transition-all ${waitThresh === 25 ? "active ring-2 ring-black/20" : "opacity-60 bg-white"}`} onClick={() => setWaitThresh(25)}>25m Normal</button>
      </div>
      <div className="flex gap-3 w-full mt-2">
        <button
          className="btn highlight transition-transform flex-1 !text-sm !py-2.5"
          disabled={!waitInput.trim()}
          onClick={() => {
            startWait(waitInput.trim() || "Wait Micro-task", waitThresh * 60000);
            closeSetup();
          }}
        >
          Start Hold
        </button>
        <button className="btn secondary transition-transform flex-1 !text-sm !py-2.5" onClick={closeSetup}>Cancel</button>
      </div>
    </div>
  );
}

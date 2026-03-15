import { useMemo } from "react";
import { BLOCK_NAMES, type Block } from "../types";
import { useApp } from "../context/AppContext";
import ClockFace from "./timer/ClockFace";
import TimerControls from "./timer/TimerControls";
import TimerNotes from "./timer/TimerNotes";
import { WaitSetupForm, WaitSetupProvider, useWaitSetup } from "./timer/WaitSetupForm";

function TimerLayout() {
  const { running, mode, block, setBlock, waitEnabled, targetMs, pausedLeftMs } = useApp();
  const { waitSetup, openSetup } = useWaitSetup();
  const isWait = mode === "wait";

  const hasTimeLeft = useMemo(() => {
    const left = running && targetMs ? Math.max(0, targetMs - Date.now()) : (pausedLeftMs || 0);
    return left > 0;
  }, [running, targetMs, pausedLeftMs]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full px-2 sm:px-6">
      {!waitSetup && (
        <div className="flex gap-1.5 flex-wrap justify-center w-full max-w-100" style={{ opacity: running ? 0 : 1, pointerEvents: running ? "none" : "auto", transition: "opacity 0.2s" }}>
          {BLOCK_NAMES.map((b: Block) => (
            <button key={b} className={`tab flex-1 min-w-18 px-3! text-xs sm:text-sm font-bold tracking-wide ${b === block ? "active" : ""}`} onClick={() => setBlock(b)}>
              {b}
            </button>
          ))}
          {waitEnabled && running && !isWait && mode === "w" && hasTimeLeft && (
            <button className="btn secondary px-4! py-2! shrink-0 col-span-3 hover:bg-orange-500! hover:text-white! border border-black/5 transition-all text-orange-600" onClick={openSetup}>
              Wait
            </button>
          )}
        </div>
      )}

      <WaitSetupForm />
      {!waitSetup && <TimerNotes />}

      {!waitSetup && (
        <>
          <p className="label shrink-0 tracking-widest uppercase opacity-70 text-[11px] font-black">{isWait ? "Pending Engagement" : mode === "w" ? "Focus" : mode === "b" ? "Rest" : "Scheduled Idle"}</p>
          <ClockFace />
          <TimerControls />
        </>
      )}
    </div>
  );
}

export default function Timer() {
  return (
    <WaitSetupProvider>
      <TimerLayout />
    </WaitSetupProvider>
  );
}

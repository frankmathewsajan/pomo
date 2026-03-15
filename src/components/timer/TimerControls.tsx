import { useApp } from "../../context/AppContext";
import { useWaitSetup } from "./WaitSetupForm";

export default function TimerControls() {
  const { running, mode, block, queue, pendingNext, waitTask, activeQueueItem, toggle, reset, resetAndRequeue, finish, continueSame, nextInQueue, cancelPending, resolveWait, abandonWait } = useApp();
  const { openSetup } = useWaitSetup();
  const isWait = mode === "wait";
  const canRequeueOnReset = mode === "w" && !running && !!activeQueueItem;

  if (mode === "w") {
    return (
      <div className="flex flex-col gap-3 w-full max-w-75">
        <div className="flex gap-3 sm:gap-4 w-full">
          <button className="btn transition-transform flex-1 text-sm py-2.5 sm:py-3" onClick={toggle}>{running ? "Pause" : "Start"}</button>
          {running && <button className="btn secondary transition-transform flex-1 text-sm py-2.5 sm:py-3 opacity-90" onClick={openSetup}>Wait</button>}
          {running && <button className="btn transition-transform flex-1 text-sm py-2.5 sm:py-3" style={{ background: "var(--card)", color: "var(--text)" }} onClick={finish}>Finish</button>}
          {!running && <button className="btn secondary transition-transform flex-1 text-sm py-2.5 sm:py-3" onClick={reset}>Reset</button>}
        </div>
        {canRequeueOnReset && <button className="btn highlight transition-transform w-full text-sm py-2.5 sm:py-3" onClick={resetAndRequeue}>Reset and Return to Queue</button>}
      </div>
    );
  }

  if (isWait) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="text-xs font-semibold uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full" style={{ color: "var(--text)" }}>
          Micro-task: <span style={{ color: "var(--accent)" }}>{waitTask}</span>
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[320px]">
          <button className="btn highlight transition-transform w-full text-sm py-2.5 sm:py-3" onClick={resolveWait}>Reply Arrived (Resume Origin)</button>
          <button className="btn secondary transition-transform w-full text-sm py-2.5 sm:py-3 opacity-80 hover:bg-black/10" onClick={abandonWait}>Force Honourable Abandonment</button>
        </div>
      </div>
    );
  }

  if (mode === "b") {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        {pendingNext ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-[320px]">
            <p className="text-sm font-semibold tracking-wide text-center" style={{ color: "var(--accent)" }}>
              ▶ Up next: <span className="font-bold">{pendingNext.task || "Untitled"}</span>
              <span className="opacity-60 text-xs ml-1">({pendingNext.type})</span>
            </p>
            <p className="text-xs opacity-50 text-center">Starts automatically when break ends</p>
            <button className="btn secondary transition-transform text-xs py-1.5 px-4 opacity-70 hover:opacity-100" onClick={cancelPending}>Cancel</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <p className="text-sm opacity-60 font-medium tracking-wide text-center">Take a break... or optionally skip to:</p>
            {block === "normal" && <p className="text-xs max-w-[320px] text-center opacity-70">Pattern interrupt: use the 20-20-20 rule. Look 20 feet away for 20 seconds, then spend the rest of the 5 minutes moving and resetting your posture.</p>}
            {block === "deep" && <p className="text-xs max-w-[320px] text-center opacity-70">Deep reset: step away for the full 17 minutes so your default mode network can recover before the next analytical block.</p>}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[320px]">
          <button className="btn secondary transition-transform flex-1 text-sm py-2.5 sm:py-3" onClick={continueSame}>Continue Same</button>
          <button className="btn highlight transition-transform flex-1 text-sm py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed" onClick={nextInQueue} disabled={queue.length === 0 || !!pendingNext}>
            {pendingNext ? "Queued ✓" : "Next in Queue"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

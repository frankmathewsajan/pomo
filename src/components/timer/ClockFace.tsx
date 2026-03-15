import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { Block } from "../../types";
import { useTimerNotifications } from "../../hooks/useTimerNotifications";

const R = 90;
const C = 2 * Math.PI * R;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function ClockFace() {
  const { running, mode, block, durations, targetMs, pausedLeftMs, waitStartMs, waitTargetMs } = useApp();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const { isWait, displaySec, progress, timeLeftMs } = useMemo(() => {
    const wait = mode === "wait";
    const timeLeft = running && targetMs ? Math.max(0, targetMs - now) : pausedLeftMs || 0;
    const waitElapsed = wait && waitStartMs ? Math.max(0, now - waitStartMs) : 0;
    const waitLeft = wait && waitTargetMs ? Math.max(0, waitTargetMs - now) : 0;

    const [w, b] = mode === "idle" ? [0, 0] : durations[block as Block] || [0, 0];
    const totalMs = mode === "idle" ? 1 : (mode === "w" ? w : b) * 60000;

    let progressValue = 1;
    if (mode === "idle") {
      progressValue = 1;
    } else if (wait) {
      const waitTotalMs = waitElapsed + waitLeft;
      progressValue = waitTotalMs > 0 ? waitLeft / waitTotalMs : 0;
    } else {
      progressValue = 1 - timeLeft / totalMs;
    }

    return {
      isWait: wait,
      displaySec: wait ? Math.floor(waitElapsed / 1000) : Math.ceil(timeLeft / 1000),
      progress: progressValue,
      timeLeftMs: timeLeft,
    };
  }, [running, mode, block, durations, targetMs, pausedLeftMs, waitStartMs, waitTargetMs, now]);

  useTimerNotifications(progress, running, mode, block);

  return (
    <div className={`relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center my-2 sm:my-4 transition-all duration-500 ${isWait ? "scale-90 opacity-90" : ""}`}>
      <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border-ring)" strokeWidth="6" opacity=".15" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * Math.min(1, Math.max(0, progress))}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      {isWait ? (
        <div className="flex flex-col items-center">
          <span className="time text-4xl sm:text-5xl tracking-tight" style={{ color: "var(--accent)", transition: "color 0.3s" }}>{fmt(displaySec)}</span>
          <span className="time text-sm opacity-40 mt-1 line-through" title="Paused main block">{fmt(Math.ceil(timeLeftMs / 1000))}</span>
        </div>
      ) : (
        <span className="time text-5xl sm:text-6xl tracking-tight">{fmt(displaySec)}</span>
      )}
    </div>
  );
}

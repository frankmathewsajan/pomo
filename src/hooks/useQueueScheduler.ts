import { useMemo } from "react";
import type { Block, QueuedBlock } from "../types";
import { resolveQueueSchedule } from "../utils/queueTime";

type UseQueueSchedulerInput = {
  queue: QueuedBlock[];
  durations: Record<Block, readonly [number, number]>;
  mode: "w" | "b" | "idle" | "wait";
  block: Block | "idle";
  running: boolean;
  targetMs: number | null;
  pausedLeftMs: number | null;
  showArchived: boolean;
  showRecurring: boolean;
};

export function useQueueScheduler(input: UseQueueSchedulerInput) {
  return useMemo(
    () => resolveQueueSchedule(input),
    [
      input.block,
      input.durations,
      input.mode,
      input.pausedLeftMs,
      input.queue,
      input.running,
      input.showArchived,
      input.showRecurring,
      input.targetMs,
    ]
  );
}
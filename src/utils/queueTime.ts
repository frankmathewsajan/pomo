import type { Block, QueuedBlock } from "../types";

type QueueScheduleInput = {
  queue: QueuedBlock[];
  durations: Record<Block, readonly [number, number]>;
  mode: "w" | "b" | "idle" | "wait";
  block: Block | "idle";
  running: boolean;
  targetMs: number | null;
  pausedLeftMs: number | null;
  showArchived: boolean;
  showRecurring: boolean;
  nowMs?: number;
};

export type ResolvedQueueEntry = {
  start: Date;
  end: Date;
  originalIndex: number;
};

export function getFixedTarget(idleTime: string, nowMs = Date.now()) {
  if (idleTime.includes("T")) return new Date(idleTime);

  const target = new Date(nowMs);
  const [hours, minutes] = idleTime.split(":").map(Number);
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= nowMs) {
    target.setTime(target.getTime() + 86400000);
  }

  return target;
}

export function isDueNow(idleTime: string, nowMs = Date.now()) {
  return getFixedTarget(idleTime, nowMs).getTime() <= nowMs;
}

export function resolveQueueSchedule({
  queue,
  durations,
  mode,
  block,
  running,
  targetMs,
  pausedLeftMs,
  showArchived,
  showRecurring,
  nowMs = Date.now(),
}: QueueScheduleInput) {
  const canHide = queue.some((item) => item.recurring && !item.archived);
  const visibleQueue = queue.filter((item) => {
    if (showArchived) return item.archived;
    if (item.archived) return false;
    if (!showRecurring && item.recurring) return false;
    return true;
  });

  const leftMs = running && targetMs ? Math.max(0, targetMs - nowMs) : pausedLeftMs || 0;
  const currentTime = new Date(nowMs);
  currentTime.setSeconds(currentTime.getSeconds() + Math.ceil(leftMs / 1000));

  if (mode === "w" && block !== "idle") {
    const currentBlock = durations[block] || [0, 0];
    currentTime.setMinutes(currentTime.getMinutes() + currentBlock[1]);
  }

  const realNow = new Date(nowMs);
  const fixedBlocks = visibleQueue
    .filter((item) => item.idleTime)
    .map((item) => {
      const start = getFixedTarget(item.idleTime!, nowMs);
      const timing = durations[item.type] || [25, 5];
      const end = new Date(start.getTime());
      end.setMinutes(end.getMinutes() + timing[0] + timing[1]);
      return { id: item.id, start: start.getTime(), end: end.getTime() };
    });

  const resolvedMap = new Map<string, ResolvedQueueEntry>();

  visibleQueue.forEach((item, index) => {
    if (!item.idleTime) return;
    const start = getFixedTarget(item.idleTime, nowMs);
    const end = new Date(start.getTime());
    end.setMinutes(end.getMinutes() + (durations[item.type] || [25, 5])[0]);
    resolvedMap.set(item.id, { start, end, originalIndex: index });
  });

  let iterTime = new Date(currentTime.getTime());

  visibleQueue.forEach((item, index) => {
    if (item.idleTime) return;

    if (iterTime.getTime() < realNow.getTime()) {
      iterTime = new Date(realNow);
    }

    const timing = durations[item.type] || [25, 5];
    const blockDurationMs = timing[0] * 60000;
    const totalDurationMs = (timing[0] + timing[1]) * 60000;

    let validStart = new Date(iterTime.getTime());
    let overlap = true;

    while (overlap && fixedBlocks.length > 0) {
      overlap = false;
      const tentativeEnd = new Date(validStart.getTime() + totalDurationMs);

      for (const fixedBlock of fixedBlocks) {
        if (tentativeEnd.getTime() > fixedBlock.start && validStart.getTime() < fixedBlock.end) {
          validStart = new Date(fixedBlock.end);
          overlap = true;
          break;
        }
      }
    }

    const start = validStart;
    const end = new Date(start.getTime() + blockDurationMs);
    resolvedMap.set(item.id, { start, end, originalIndex: index });
    iterTime = new Date(start.getTime() + totalDurationMs);
  });

  const resolvedQueue = [...visibleQueue].sort((left, right) => {
    const leftResolved = resolvedMap.get(left.id)!;
    const rightResolved = resolvedMap.get(right.id)!;
    const diff = leftResolved.start.getTime() - rightResolved.start.getTime();
    if (diff !== 0) return diff;
    return leftResolved.originalIndex - rightResolved.originalIndex;
  });

  return { canHide, resolvedQueue, resolvedMap, realNow };
}
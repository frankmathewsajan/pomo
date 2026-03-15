import type { QueuedBlock, Block, RecurringOption } from "../../types";

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type QueueFormState = {
  type: Block;
  task: string;
  notes: string;
  isIdle: boolean;
  idleTime: string;
  recurring: boolean;
  recurringOption: RecurringOption;
  recurringDays: number[];
  tags: string[];
};

export type QueueEditState = QueueFormState & {
  id: string;
};

export function createDateTimeValue() {
  const current = new Date();
  current.setMinutes(current.getMinutes() - current.getTimezoneOffset());
  return current.toISOString().slice(0, 16);
}

export function createQueueFormState(): QueueFormState {
  return {
    type: "normal",
    task: "",
    notes: "",
    isIdle: false,
    idleTime: createDateTimeValue(),
    recurring: false,
    recurringOption: "daily",
    recurringDays: [],
    tags: [],
  };
}

export function createQueueEditState(item: QueuedBlock): QueueEditState {
  return {
    id: item.id,
    type: item.type,
    task: item.task,
    notes: item.notes || "",
    isIdle: Boolean(item.idleTime),
    idleTime: item.idleTime || createDateTimeValue(),
    recurring: Boolean(item.recurring),
    recurringOption: item.recurringOption || "daily",
    recurringDays: item.recurringDays || [],
    tags: item.tags || [],
  };
}
export const DEF_BLOCKS = { mini: [10, 2], normal: [25, 5], deep: [50, 10] } as const;
export type Block = keyof typeof DEF_BLOCKS;
export const BLOCK_NAMES: Block[] = ["mini", "normal", "deep"];

export type RecurringOption = "daily" | "weekly" | "weekdays" | "alternate" | "holidays";

export type QueuedBlock = {
    id: string;
    type: Block;
    task: string;
    isIdle?: boolean;
    idleTime?: string; // e.g. "2026-03-01T16:00"
    recurring?: boolean;
    recurringOption?: RecurringOption;
    recurringDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    lastGeneratedDate?: string; // e.g "YYYY-MM-DD"
    archived?: boolean;
    notes?: string;
    createdAt?: number;
};

export type HistoryStatus = "completed" | "early" | "aborted" | "scheduled" | "abandoned" | "micro-task";

export type Entry = {
    task: string;
    block: Block;
    at: number;
    status: HistoryStatus;
    notes?: string;
};

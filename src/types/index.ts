export const DEF_BLOCKS = { mini: [15, 0], normal: [25, 5], deep: [52, 17] } as const;
export type Block = keyof typeof DEF_BLOCKS;
export const BLOCK_NAMES: Block[] = ["mini", "normal", "deep"];

export type RecurringOption = "daily" | "weekly" | "weekdays" | "alternate" | "holidays";

export type QueuedBlock = {
    id: string;
    type: Block;
    task: string;
    recurring?: boolean;
    recurringOption?: RecurringOption;
    recurringDays?: number[]; // 0=Sun, 6=Sat
    lastGeneratedDate?: string;
    idleTime?: string;
    isIdle?: boolean;
    archived?: boolean;
    notes?: string;
    createdAt?: number;
    tags?: string[];
};

export type HistoryStatus = "completed" | "early" | "aborted" | "scheduled" | "abandoned" | "micro-task";

export type Entry = {
    task: string;
    block: Block;
    at: number;
    status: HistoryStatus;
    notes?: string;
    tags?: string[];
};

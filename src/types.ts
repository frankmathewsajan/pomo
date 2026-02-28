export const DEF_BLOCKS = { mini: [10, 2], normal: [25, 5], deep: [50, 10] } as const;
export type Block = keyof typeof DEF_BLOCKS;
export const BLOCK_NAMES: Block[] = ["mini", "normal", "deep"];

export type QueuedBlock = {
    id: string;
    type: Block;
    task: string;
    isIdle?: boolean;
    idleTime?: string; // e.g. "16:00"
};

export type HistoryStatus = "completed" | "early" | "aborted" | "scheduled";

export type Entry = {
    task: string;
    block: Block;
    at: number;
    status: HistoryStatus;
};

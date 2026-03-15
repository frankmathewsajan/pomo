import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEF_BLOCKS, BLOCK_NAMES, type Block, type QueuedBlock, type Entry, type HistoryStatus } from './types';
import { T } from './utils/themes';
import App from './App';

// ── Tauri mocks ──────────────────────────────────────────────────────────

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        minimize: vi.fn(),
        toggleMaximize: vi.fn(),
        close: vi.fn(),
        scaleFactor: vi.fn().mockResolvedValue(1),
        innerSize: vi.fn().mockResolvedValue({
            toLogical: vi.fn().mockReturnValue({ width: 800, height: 600 })
        }),
        setSize: vi.fn().mockResolvedValue(undefined)
    }),
    LogicalSize: class { constructor(public width: number, public height: number) { } }
}));

vi.mock('@tauri-apps/plugin-notification', () => ({
    isPermissionGranted: vi.fn().mockResolvedValue(true),
    requestPermission: vi.fn().mockResolvedValue('granted'),
    sendNotification: vi.fn()
}));

Object.defineProperty(window, '__TAURI__', { value: {}, writable: true });

beforeEach(() => {
    localStorage.clear();
});

// ── Types ────────────────────────────────────────────────────────────────

describe('Types & Constants', () => {
    it('BLOCK_NAMES contains exactly mini, normal, deep', () => {
        expect(BLOCK_NAMES).toEqual(['mini', 'normal', 'deep']);
    });

    it('DEF_BLOCKS defines correct [work, break] pairs', () => {
        expect(DEF_BLOCKS.mini).toEqual([10, 2]);
        expect(DEF_BLOCKS.normal).toEqual([25, 5]);
        expect(DEF_BLOCKS.deep).toEqual([50, 10]);
    });

    it('Block type accepts only valid keys', () => {
        const validBlocks: Block[] = ['mini', 'normal', 'deep'];
        validBlocks.forEach(b => expect(b in DEF_BLOCKS).toBe(true));
    });

    it('HistoryStatus accepts valid values', () => {
        const statuses: HistoryStatus[] = ['completed', 'early', 'aborted', 'scheduled'];
        expect(statuses).toHaveLength(4);
    });

    it('QueuedBlock shape has all required fields', () => {
        const q: QueuedBlock = { id: 'x', type: 'normal', task: 'Test' };
        expect(q.id).toBe('x');
        expect(q.type).toBe('normal');
        expect(q.task).toBe('Test');
    });

    it('QueuedBlock optional fields default to undefined', () => {
        const q: QueuedBlock = { id: 'x', type: 'mini', task: 'T' };
        expect(q.notes).toBeUndefined();
        expect(q.recurring).toBeUndefined();
        expect(q.archived).toBeUndefined();
        expect(q.createdAt).toBeUndefined();
        expect(q.idleTime).toBeUndefined();
    });

    it('Entry shape is correct', () => {
        const e: Entry = { task: 'Work', block: 'normal', at: Date.now(), status: 'completed' };
        expect(e.task).toBe('Work');
        expect(e.status).toBe('completed');
    });
});

// ── Themes ───────────────────────────────────────────────────────────────

describe('Themes', () => {
    it('has at least 3 themes', () => {
        expect(T.length).toBeGreaterThanOrEqual(3);
    });

    it('every theme has a unique name', () => {
        const names = T.map(t => t.name);
        expect(new Set(names).size).toBe(names.length);
    });

    it('every theme has a unique CSS class', () => {
        const classes = T.map(t => t.cls);
        expect(new Set(classes).size).toBe(classes.length);
    });

    const requiredVars = ['--bg', '--card', '--text', '--accent', '--radius', '--font', '--weight'] as const;
    it.each(T.map(t => [t.name, t]))('theme "%s" has all required CSS variables', (_name, theme) => {
        requiredVars.forEach(v => {
            expect((theme as typeof T[number]).v).toHaveProperty(v);
        });
    });

    it('all color values look valid (hex or rgba/rgb)', () => {
        T.forEach(t => {
            const bg = t.v['--bg'];
            expect(bg).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\(.+\))$/);
        });
    });
});

// ── Context / persistence ────────────────────────────────────────────────

describe('Context & State Persistence', () => {
    it('loads default state when no native store is available', () => {
        render(<App />);
        expect(screen.getByText(/POMO/i)).toBeInTheDocument();
    });

    it('survives legacy localStorage noise gracefully', () => {
        localStorage.setItem('pomo-state', 'NOT_JSON{{{');
        localStorage.setItem('pomo-history', '[broken');
        expect(() => render(<App />)).not.toThrow();
    });

    it('ignores legacy localStorage persistence in plugin-store mode', () => {
        const state = {
            theme: 0, running: false, mode: 'w', block: 'deep', task: 'Persisted Task',
            queue: [], durations: DEF_BLOCKS, targetMs: null, pausedLeftMs: 3000000, notes: ''
        };
        localStorage.setItem('pomo-state', JSON.stringify(state));
        render(<App />);
        expect(screen.queryByDisplayValue('Persisted Task')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
});

// ── App Rendering ────────────────────────────────────────────────────────

describe('App Layout', () => {
    it('renders the POMO title', () => {
        render(<App />);
        expect(screen.getByText(/POMO/i)).toBeInTheDocument();
    });

    it('renders collapsed Activity sidebar with label', () => {
        render(<App />);
        expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('renders collapsed Queue sidebar with label', () => {
        render(<App />);
        expect(screen.getByText('Queue')).toBeInTheDocument();
    });

    it('renders window control buttons', () => {
        render(<App />);
        expect(screen.getByText('─')).toBeInTheDocument(); // minimize
        expect(screen.getByText('□')).toBeInTheDocument(); // maximize
        expect(screen.getByText('✕')).toBeInTheDocument(); // close
    });
});

// ── Timer ────────────────────────────────────────────────────────────────

describe('Timer', () => {
    it('renders block type tabs (mini, normal, deep)', () => {
        render(<App />);
        BLOCK_NAMES.forEach(b => {
            expect(screen.getByText(b)).toBeInTheDocument();
        });
    });

    it('renders task name input', () => {
        render(<App />);
        expect(screen.getByPlaceholderText('Task name…')).toBeInTheDocument();
    });

    it('renders Start button in work mode', () => {
        render(<App />);
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('renders Reset button in work mode', () => {
        render(<App />);
        expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('shows Focus label in work mode', () => {
        render(<App />);
        expect(screen.getByText('Focus')).toBeInTheDocument();
    });

    it('shows timer display with MM:SS format', () => {
        render(<App />);
        // Default normal block = 25min = "25:00"
        expect(screen.getByText('25:00')).toBeInTheDocument();
    });
});

// ── Interactions ─────────────────────────────────────────────────────────

describe('Interactions', () => {
    it('typing in the task input updates value', () => {
        render(<App />);
        const input = screen.getByPlaceholderText('Task name…') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'My Task' } });
        expect(input.value).toBe('My Task');
    });

    it('clicking Start toggles to Pause', () => {
        render(<App />);
        const btn = screen.getByText('Start');
        fireEvent.click(btn);
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('clicking a block tab switches the timer duration', () => {
        render(<App />);
        fireEvent.click(screen.getByText('mini'));
        // mini = 10 min
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('clicking deep block shows 50:00', () => {
        render(<App />);
        fireEvent.click(screen.getByText('deep'));
        expect(screen.getByText('50:00')).toBeInTheDocument();
    });

    it('selecting a block tab highlights it', () => {
        render(<App />);
        const miniBtn = screen.getByText('mini');
        fireEvent.click(miniBtn);
        expect(miniBtn.className).toContain('active');
    });
});

// ── Sidebar Interactions ──────────────────────────────────────────────────

describe('Sidebar Interactions', () => {
    it('clicking collapsed Queue sidebar opens it', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Queue'));
        expect(screen.getByText('Up Next')).toBeInTheDocument();
    });

    it('clicking collapsed Activity sidebar opens it', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Activity'));
        expect(screen.getByText('Activity & History')).toBeInTheDocument();
    });

    it('Queue sidebar shows add block form when open', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Queue'));
        expect(screen.getByText('Add block')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Task name...')).toBeInTheDocument();
    });

    it('Queue sidebar shows task name and notes inputs', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Queue'));
        expect(screen.getByPlaceholderText('Task name...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Notes (HTML supported)...')).toBeInTheDocument();
    });

    it('adding a queue item shows it in the list', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Queue'));
        const input = screen.getByPlaceholderText('Task name...') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'New Task' } });
        fireEvent.click(screen.getByText('+ Add to Queue'));
        expect(screen.getByText('New Task')).toBeInTheDocument();
    });

    it('empty task name does not add to queue', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Queue'));
        fireEvent.click(screen.getByText('+ Add to Queue'));
        expect(screen.getByText('Your queue is empty.')).toBeInTheDocument();
    });

    it('Activity sidebar shows filter buttons when open', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Activity'));
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.getByText('Early')).toBeInTheDocument();
    });

    it('Activity sidebar shows empty state', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Activity'));
        expect(screen.getByText('No history found.')).toBeInTheDocument();
    });
});

// ── SyncMenu ─────────────────────────────────────────────────────────────

describe('SyncMenu', () => {
    it('renders sync button with tooltip', () => {
        render(<App />);
        expect(screen.getByTitle('Sync / Config')).toBeInTheDocument();
    });

    it('clicking sync button reveals export/import options', () => {
        render(<App />);
        fireEvent.click(screen.getByTitle('Sync / Config'));
        expect(screen.getByText('Export Config (JSON)')).toBeInTheDocument();
        expect(screen.getByText('Import Config (JSON)')).toBeInTheDocument();
    });
});

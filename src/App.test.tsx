import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BLOCK_NAMES } from './types';
import { T } from './themes';
import App from './App';

// Mock Tauri window APIs
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
    LogicalSize: class LogicalSize {
        width: number;
        height: number;
        constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
        }
    }
}));

Object.defineProperty(window, '__TAURI__', { value: {} });

describe('App Utilities & Components', () => {
    it('defines the correct block names', () => {
        expect(BLOCK_NAMES).toEqual(['mini', 'normal', 'deep']);
    });

    it('contains themes with correct properties', () => {
        expect(T.length).toBeGreaterThan(0);
        expect(T[0]).toHaveProperty('name');
        expect(T[0]).toHaveProperty('v');
        expect(T[0].v).toHaveProperty('--bg');
    });

    it('renders the App container and title', () => {
        render(<App />);
        expect(screen.getByText(/POMO/i)).toBeInTheDocument();
        expect(screen.getByText(/Queue/i)).toBeInTheDocument();
    });
});

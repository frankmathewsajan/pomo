import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BLOCK_NAMES } from './types';
import { T } from './themes';
import App from './App';

// Mock Tauri window APIs
vi.stubGlobal('window', {
    __TAURI__: {
        window: {
            getCurrentWindow: () => ({
                minimize: vi.fn(),
                toggleMaximize: vi.fn(),
                close: vi.fn()
            })
        }
    }
});

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

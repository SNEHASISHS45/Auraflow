import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PullToRefresh } from '../components/ui/PullToRefresh';

// Mock soundService
vi.mock('../services/soundService', () => ({
  soundService: {
    playRefresh: vi.fn(),
  },
}));

// Mock framer-motion useMotionValue if needed, but jsdom usually handles it fine.
// Actually, framer-motion relies on requestAnimationFrame which jsdom mocks via separate package or recent jsdom versions.
// If it fails, I might need to mock ResizeObserver too.

describe('PullToRefresh', () => {
  it('renders children correctly', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Test Content</div>
      </PullToRefresh>
    );
    expect(getByText('Test Content')).toBeDefined();
  });
});


import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React, { useState } from 'react';

// Mock WallpaperCard to track mounts
const MountTracker = vi.fn();

const MockWallpaperCard = ({ item, index }: any) => {
  React.useEffect(() => {
    MountTracker('mount', item.id);
    return () => MountTracker('unmount', item.id);
  }, []);
  return <div data-testid={`card-${item.id}`}>{item.title}</div>;
};

describe('Wallpaper List Performance', () => {
  it('demonstrates remounts with index keys vs stable mounts with ID keys', async () => {

    const ListComponent = ({ useIndexKey }: { useIndexKey: boolean }) => {
      const [items, setItems] = useState([
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
      ]);

      const prependItem = () => {
        setItems(prev => [{ id: '3', title: 'Item 3' }, ...prev]);
      };

      return (
        <div>
          <button onClick={prependItem}>Prepend</button>
          {items.map((item, idx) => (
             <MockWallpaperCard
               key={useIndexKey ? `${item.id}-${idx}` : item.id}
               item={item}
               index={idx}
             />
          ))}
        </div>
      );
    };

    console.log('--- Testing with Index Keys (Baseline) ---');
    MountTracker.mockClear();
    const { unmount: unmount1, getByText: getByText1 } = render(<ListComponent useIndexKey={true} />);

    // Initial mount: 2 items
    expect(MountTracker).toHaveBeenCalledTimes(2);
    MountTracker.mockClear();

    // Prepend item
    await act(async () => {
      getByText1('Prepend').click();
    });

    // With index keys:
    // Old list: [A, B] keys: "1-0", "2-1"
    // New list: [C, A, B] keys: "3-0", "1-1", "2-2"
    // Expect remounts

    const calls = MountTracker.mock.calls.map(c => c[0]); // 'mount' or 'unmount'
    const mounts = calls.filter(c => c === 'mount').length;
    console.log(`Index Key Mounts on Prepend: ${mounts} (Expected 3)`);

    // We expect mounts for all 3 items because keys changed for everyone.
    expect(mounts).toBe(3);

    unmount1();

    console.log('\n--- Testing with ID Keys (Optimized) ---');
    MountTracker.mockClear();
    const { getByText: getByText2 } = render(<ListComponent useIndexKey={false} />);

    expect(MountTracker).toHaveBeenCalledTimes(2);
    MountTracker.mockClear();

    await act(async () => {
      getByText2('Prepend').click();
    });

    // With ID keys:
    // Old list: [A, B] keys: "1", "2"
    // New list: [C, A, B] keys: "3", "1", "2"
    // Should only mount "3".

    const calls2 = MountTracker.mock.calls.map(c => c[0]);
    const mounts2 = calls2.filter(c => c === 'mount').length;
    console.log(`ID Key Mounts on Prepend: ${mounts2} (Expected 1)`);

    expect(mounts2).toBe(1); // Only the new item mounted
  });
});

import React, { useMemo } from 'react';

interface MasonryProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    columns?: number | { [key: number]: number };
    gap?: number;
    className?: string;
}

/**
 * Pinterest Mercury-style Masonry component.
 * Uses the "Shortest Column First" algorithm to distribute items across columns
 * with tight spacing and responsive breakpoints matching Pinterest's layout.
 */
export function Masonry<T extends { id: string | number }>({
    items,
    renderItem,
    columns = { 0: 2, 640: 2, 768: 3, 1024: 4, 1280: 5, 1536: 6 },
    gap = 8,
    className = ""
}: MasonryProps<T>) {
    const [currentCols, setCurrentCols] = React.useState(2);

    React.useEffect(() => {
        const updateCols = () => {
            const width = window.innerWidth;
            if (typeof columns === 'number') {
                setCurrentCols(columns);
                return;
            }

            const breakpoints = Object.keys(columns)
                .map(Number)
                .sort((a, b) => b - a);

            const breakpoint = breakpoints.find(b => width >= b);
            setCurrentCols(breakpoint ? columns[breakpoint] : 2);
        };

        updateCols();
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, [columns]);

    // Distribute items into columns using shortest-column-first
    const columnData = useMemo(() => {
        const cols: T[][] = Array.from({ length: currentCols }, () => []);
        const colHeights = Array(currentCols).fill(0);

        items.forEach((item) => {
            let shortestIndex = 0;
            for (let i = 1; i < currentCols; i++) {
                if (colHeights[i] < colHeights[shortestIndex]) {
                    shortestIndex = i;
                }
            }

            cols[shortestIndex].push(item);

            const typedItem = item as any;
            const aspectRatio = typedItem.width && typedItem.height ? typedItem.height / typedItem.width : 1.5;
            colHeights[shortestIndex] += aspectRatio;
        });

        return cols;
    }, [items, currentCols]);

    return (
        <div
            className={`masonry-grid ${className}`}
            style={{ display: 'flex', gap: `${gap}px`, width: '100%' }}
        >
            {columnData.map((colItems, colIdx) => (
                <div
                    key={colIdx}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${gap}px`, minWidth: 0 }}
                >
                    {colItems.map((item, itemIdx) => (
                        <div key={item.id}>
                            {renderItem(item, itemIdx)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

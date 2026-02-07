## 2024-05-23 - List Rendering Optimization
**Learning:** In this codebase, lists (like wallpapers) often require derived properties (e.g. converting `WallpaperItem` to `Wallpaper`). Doing this conversion in the parent map loop breaks referential equality for `React.memo` components.
**Action:** Move the conversion logic inside the child component using `useMemo` (e.g. `const wp = useMemo(() => toWallpaper(item), [item]);`) and pass only the stable `item` prop. Also ensure callback props like `onLike` are memoized in the parent.

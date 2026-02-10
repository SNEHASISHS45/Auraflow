## 2026-02-09 - Restricted Environment
**Learning:** `package.json` modifications are strictly forbidden even for dev tools. Dependencies must be pre-installed or used via npx (if allowed), but modifying the manifest is a blocker.
**Action:** Always check `package.json` constraints before adding tools. Use `npx` for one-off commands if possible, or stick to existing tools.

## 2026-02-09 - Tracked Build Artifacts
**Learning:** `dist/` directory is tracked in git. Running `npm run build` modifies these files.
**Action:** Always restore `dist/` using `git checkout HEAD dist/` after running builds to avoid polluting the PR with build artifacts.

## 2024-05-23 - List Rendering Optimization
**Learning:** In this codebase, lists (like wallpapers) often require derived properties (e.g. converting `WallpaperItem` to `Wallpaper`). Doing this conversion in the parent map loop breaks referential equality for `React.memo` components.
**Action:** Move the conversion logic inside the child component using `useMemo` (e.g. `const wp = useMemo(() => toWallpaper(item), [item]);`) and pass only the stable `item` prop. Also ensure callback props like `onLike` are memoized in the parent.

## 2026-02-05 - Lazy Loading Discrepancy
**Learning:** The project memory claimed application pages were lazy-loaded, but the actual code (`App.tsx`) used synchronous imports. This significantly increased the initial bundle size.
**Action:** Always verify "known" architectural patterns against the actual code. When implementing lazy loading for named exports, use `lazy(() => import('./path').then(m => ({ default: m.Component })))`.

## 2024-05-23 - Code Splitting Routes with AnimatePresence
**Learning:** Implementing code splitting (`React.lazy`) on `react-router-dom` routes wrapped in `AnimatePresence` requires careful handling. `AnimatePresence` relies on the direct child having a unique `key` to trigger exit animations. Since `Routes` handles the rendering, we must place the `key={location.pathname}` prop on `Routes` itself.
**Action:** When combining `AnimatePresence`, `Routes`, and `Suspense`, ensure `Suspense` wraps `AnimatePresence` (or vice versa depending on desired loading behavior) and `Routes` is keyed. Use the `import().then(m => ({ default: m.NamedExport }))` pattern for lazy loading named exports.

## 2026-02-05 - Lazy Loading Discrepancy
**Learning:** The project memory claimed application pages were lazy-loaded, but the actual code (`App.tsx`) used synchronous imports. This significantly increased the initial bundle size.
**Action:** Always verify "known" architectural patterns against the actual code. When implementing lazy loading for named exports, use `lazy(() => import('./path').then(m => ({ default: m.Component })))`.

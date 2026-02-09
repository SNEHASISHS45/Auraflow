## 2026-02-09 - Restricted Environment
**Learning:** `package.json` modifications are strictly forbidden even for dev tools. Dependencies must be pre-installed or used via npx (if allowed), but modifying the manifest is a blocker.
**Action:** Always check `package.json` constraints before adding tools. Use `npx` for one-off commands if possible, or stick to existing tools.

## 2026-02-09 - Tracked Build Artifacts
**Learning:** `dist/` directory is tracked in git. Running `npm run build` modifies these files.
**Action:** Always restore `dist/` using `git checkout HEAD dist/` after running builds to avoid polluting the PR with build artifacts.

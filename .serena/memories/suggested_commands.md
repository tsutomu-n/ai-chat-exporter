# Suggested commands
- `bun test` : run the test suite.
- `bun test tests/repo-layout.test.js` : run repository/public-artifact layout checks.
- `bash scripts/generate_oneline_bookmarklet.sh` : regenerate bookmarklet artifacts.
- `bash scripts/sync_docs_assets.sh` : mirror root bookmarklet artifacts into `docs/`.
- `rg --files -g '!node_modules' -g '!dist' -g '!build' -g '!target' -g '!.git'` : list tracked source files without build artifacts.
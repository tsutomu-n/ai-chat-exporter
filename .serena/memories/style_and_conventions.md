# Style and conventions
- Repository favors a single readable source file and checked-in generated bookmarklet artifacts.
- Tests assert public repository shape, docs links/content, and generated bookmarklet constraints.
- Public docs exist in English, Japanese, and Simplified Chinese.
- Generation is script-driven via `scripts/generate_oneline_bookmarklet.sh`; docs asset mirroring is handled by `scripts/sync_docs_assets.sh`.
- Use Bun first for JavaScript/TypeScript execution and testing.
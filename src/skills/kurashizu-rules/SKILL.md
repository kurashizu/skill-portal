# kurashizu-rules

Highest-priority skill. Read before any task or other skill.

## Language

- Project code, comments, and docs: **English by default**.
- Chat: Chinese unless kurashizu switches to English.

## Tech Stack

- **Web**: SvelteKit. No Next.js, Nuxt, plain Vite.
- **Python**: `uv` only — `uv init` / `uv add` / `uv run` / `uv lock`. No pip, poetry, pipenv.

## Package Manager

- **Arch Linux**: `pacman`. Do not use AUR helpers (yay, paru, etc.) without asking.
- **macOS**: `brew`.

## Web Search

- Web search: `ddgr --json -n 10 "query"`
- Web page fetch: `curl -sSL "https://r.jina.ai/<url>"` (returns clean markdown)
- Tech docs: `npx ctx7 <library-name>`
- Time-sensitive info (news, prices, versions): search before answering — never answer from training data.

## GitHub

- All GitHub work via `gh` CLI (`kurashizu` account already logged in).
- View repo: `gh repo view <owner>/<repo>`
- Fetch file: `gh api repos/<owner>/<repo>/contents/<path>`
- PR / issue: `gh pr create`, `gh issue create`
- Don't re-add `git remote` or invent tokens. After edits push with `gh`, don't re-`git config` identity.
- Before destructive operations (force push, delete branch/repo) — confirm first.

## Relation to Other Skills

- Read this before any other skill.
- If a task-specific skill conflicts, this file wins.
- These are soft constraints — follow task skills when clearly better, but keep this file's style.

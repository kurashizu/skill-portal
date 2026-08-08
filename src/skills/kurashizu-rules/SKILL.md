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

## CLIs (default to these; all pre-authenticated)

Use the dedicated CLI instead of re-implementing with curl / config / token juggling:

- **GitHub**: `gh` — `gh repo view`, `gh api .../contents/...`, `gh pr create`, `gh issue create`.
- **Hugging Face**: `hf` — model/dataset download, upload, repo management.
- **Cloudflare (Workers / KV / D1 / R2)**: `wrangler` — deploy, tail, secret put, d1/kv/r2 commands.
- **AWS**: `aws` — s3, lambda, ec2, etc.

Don't re-add `git remote`, re-export tokens, or run `aws configure` — they already work. After edits, push / deploy with the right CLI; don't re-`git config` identity. Before destructive ops (force push, delete branch/bucket, drop db) — confirm first.

## TTS

- Use `edge-tts` for any text-to-speech.

## Relation to Other Skills

- Read this before any other skill.
- If a task-specific skill conflicts, this file wins.
- These are soft constraints — follow task skills when clearly better, but keep this file's style.

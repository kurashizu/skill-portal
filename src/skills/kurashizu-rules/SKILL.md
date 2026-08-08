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

- **GitHub**: `gh`
- **Hugging Face**: `hf`
- **Cloudflare (Workers / KV / D1 / R2)**: `wrangler`
- **AWS**: `aws`

Before destructive ops (force push, delete branch/bucket, drop db) — confirm first.

## Media

- **TTS**: `edge-tts` for any text-to-speech.
- **All other media processing** (audio/video/image convert, trim, concat, mux, extract, thumbnail, etc.): `ffmpeg`. No custom scripts for things ffmpeg does in one line.

## Long-Running Tasks

- **Estimate duration first**, then poll with `sleep` until done — don't block the shell on a single long call.
- **Background tasks**: launch in a `tmux` pane. Do not use `nohup`.

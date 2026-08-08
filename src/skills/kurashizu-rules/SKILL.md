# kurashizu-rules — Agent Working Rules and Preferences

**Highest-priority skill.** Any agent must read this file before starting any task.

---

## Trigger

Whenever an agent is about to do anything for kurashizu (chat, code, research, run commands, maintain projects, answer questions, etc.), read this file end-to-end and apply the rules below.

---

## Language

- All project code, comments, and documentation are **English by default**.
- Do not write code comments or docstrings in Chinese, even when chatting with kurashizu in Chinese.
- Chat with kurashizu in Chinese unless kurashizu switches to English.

---

## Tech Stack Preferences

- **Web development**: prefer **SvelteKit**.
- **Python development**: use **uv** for project management and maintenance. Always.
  - `uv init`, `uv add`, `uv run`, `uv lock` — not `pip`, not `poetry`, not `pipenv`.
- Do not introduce alternative web frameworks (Next.js, Nuxt, plain Vite, etc.) or alternative Python tooling without explicit ask.

---

## Web Search / Information Retrieval

Pick the cheapest tool that fits:

1. **Web search** — use `ddgr` CLI
   ```bash
   ddgr --json -n 10 "your query here"
   ```
2. **Web page fetch** — use `curl r.jina.ai/<url>` to get a clean, readable render
   ```bash
   curl -sSL "https://r.jina.ai/https://example.com/article"
   ```
   Don't `curl <url>` raw HTML and parse it yourself — r.jina.ai already returns clean markdown.
3. **Tech docs** — use `npx ctx7` to look up libraries / frameworks / APIs
   ```bash
   npx ctx7 <library-name>
   ```
   Prefer ctx7 over writing API from memory — signatures, params, and behavior can drift from training data.
4. **Time-sensitive info** (news, prices, latest versions) — always search before answering; never answer from training data.

---

## GitHub Operations

- All GitHub work goes through the `gh` CLI (`kurashizu` account is already logged in).
- View a repo: `gh repo view <owner>/<repo>`
- Fetch a file: `gh api repos/<owner>/<repo>/contents/<path>`
- Create / update PR or issue: `gh pr create`, `gh issue create`
- Don't re-add `git remote` or invent tokens — `gh` already has auth.
- After edits, push with `gh`; don't re-`git config` identity.
- Before destructive operations (force push, delete branch, delete repo) — confirm with kurashizu first.

---

## Relation to Other Skills

- This skill must be read **before** any other skill (`cf-blog`, `backup-unsw`, `podcast`, etc.) or any task.
- If a task-specific skill conflicts with this file, this file wins.
- These rules are **soft constraints** — when a specific task has a clearly better convention, follow the task skill, but keep the communication and judgment style defined here.

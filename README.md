# skill-portal

A Cloudflare Worker that aggregates documentation references for agent skills. Deployed to the Worker named **`skill-portal`** on Cloudflare.

- **Live URL**: https://skill.022025.xyz
- **Purpose**: returns a JSON registry of skills (each with a discovery + execution block) and a markdown `/docs` page

## Layout

```
skill-portal/
├── skill-portal-worker.js  # The deployed bundle (esbuild output) — what Cloudflare runs
├── settings.json           # Snapshot of /settings from Cloudflare (compat date, bindings, etc.)
├── .gitignore
└── README.md
```

> `skill-portal-worker.js` is the **deployed bundle**. It is minified/esbuild output — edit and re-bundle from your source of truth, do not edit it directly.

## What it does

Two endpoints:

| Method | Path | Returns |
|---|---|---|
| `GET` | `/` | JSON skill registry (name, description, discovery block, execution block per skill) |
| `GET` | `/docs` | Markdown documentation page describing the portal's schema |

The current registry lists 2 skills (`cf-blog`, `backup-unsw`). To add or update skills, edit the `skills` array in the source code, re-bundle, and redeploy.

## Prerequisites

- Node.js 18+ (for `wrangler`)
- A Cloudflare account with Workers enabled
- `wrangler` installed (`npm i -g wrangler`) or via `npx wrangler`
- Logged in via `wrangler login`

## First-time setup

```bash
# Verify authentication and account
wrangler whoami
```

Create `wrangler.toml` (this repo intentionally does not commit one — see "Editing" below):

```toml
name = "skill-portal"
main = "skill-portal-worker.js"
compatibility_date = "2026-06-18"
# usage_model is configured in the dashboard
# (Workers & Pages → skill-portal → Settings → Usage Model)
```

## Deploy

```bash
wrangler deploy
```

After deploy, Cloudflare assigns a `*.workers.dev` URL. The custom domain `skill.022025.xyz` is configured separately in the dashboard under **Workers & Pages → skill-portal → Settings → Triggers**.

## Verify a deployment

```bash
wrangler tail --name skill-portal        # live logs
wrangler versions list                   # recent versions
wrangler versions view <version-id>      # inspect a version
```

Pull the live bundle to confirm parity with this repo:

```bash
TOKEN=$(grep -oP 'oauth_token\s*=\s*"\K[^"]+' ~/.config/.wrangler/config/default.toml)
ACCOUNT_ID=$(wrangler whoami 2>/dev/null | awk '/Account ID/ {print $NF}')
curl -fsS "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/skill-portal" \
  -H "Authorization: Bearer $TOKEN" -o /tmp/live.bin

# Extract the JS part
python3 -c "
import re
raw = open('/tmp/live.bin', encoding='utf-8', errors='replace').read()
m = re.search(r'name=\"skill-portal-worker\.js\"\r?\n([\s\S]*?)(?:\r?\n--[a-f0-9]+|\Z)', raw)
section = m.group(1)
body_start = section.find('\n\n')
open('/tmp/live-worker.js', 'w').write(section[body_start:].lstrip('\r\n'))
"
diff skill-portal-worker.js /tmp/live-worker.js   # should be empty if in sync
```

## Settings reference (`settings.json`)

Snapshot taken from `GET /accounts/<id>/workers/scripts/skill-portal/settings`. Reproduce these values when deploying from a clean slate:

| Field | Value | How |
|---|---|---|
| `compatibility_date` | `2026-06-18` | `wrangler.toml` |
| `compatibility_flags` | *(none)* | `wrangler.toml` |
| `usage_model` | `standard` | Dashboard: Settings → Usage Model |
| Bindings | *(none)* | n/a |

## Editing

The bundle in this repo is **generated**. To change behavior:

1. Edit your source file (the original `src/` or hand-written `worker.js` you keep elsewhere).
2. Re-bundle with esbuild or your tool of choice. Output to `skill-portal-worker.js`.
3. `wrangler deploy`.
4. Commit the regenerated `skill-portal-worker.js` so this repo stays authoritative.

> **Recommended**: maintain a separate source repository (or `src/` directory) for the unminified source, and treat this repo as the deployment artifact mirror. The deployed bundle is what Cloudflare runs; losing the source would force you to maintain the bundle by hand.

## Adding or removing a skill

Edit the `skills` array literal inside the `fetch` handler in `skill-portal-worker.js` (the `skills: [...]` block). Each entry has:

```js
{
  name: "skill-name",
  description: "...",
  discovery: { type: "url", url: "...", hint: "..." }   // or { type: "remote-shell", command: "...", hint: "..." }
  execution: { type: "remote-shell" }
}
```

Redeploy with `wrangler deploy`. Hit `GET /` to verify the new entry is registered.

## Security notes

- The portal exposes **registration metadata only** (skill names, URLs, commands). It does not contain bearer tokens, S3 credentials, or other secrets.
- The remote shell endpoint referenced by `execution.remote-shell` requires a bearer token. That token is never stored in this Worker — request it from the portal owner.
- `settings.json` contains no secrets (no bindings configured for this Worker).

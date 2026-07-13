# skill-portal

A Cloudflare Worker that aggregates documentation references for agent skills. Deployed to the Worker named **`skill-portal`** on Cloudflare.

- **Live URL**: https://skill.022025.xyz
- **Endpoints**: `GET /` returns a JSON skill registry; `GET /docs` returns Markdown documentation

## Layout

```
skill-portal/
├── src/
│   ├── index.js           # fetch handler, dispatch, SKILLS + PORTAL_META data
│   └── docs.md            # Markdown served at GET /docs (inlined at build time)
├── wrangler.toml          # Cloudflare deployment config
├── package.json           # Dev dependencies + npm scripts
├── settings.json          # Snapshot of /settings from Cloudflare
├── .gitignore
└── README.md
```

> `skill-portal-worker.js` (the esbuild bundle) is **git-ignored** — it's a build artifact, not source. After `git clone`, run `npm install && npm run build` to produce it, or just `npm run deploy` which builds + uploads in one step.

### Module ownership

| Module | Purpose |
|---|---|
| `src/index.js` | fetch handler, route dispatch, and the `SKILLS` / `PORTAL_META` data literals |
| `src/docs.md` | The Markdown document served at `/docs`. Pure data — no code. |

The two files have a clear separation: `index.js` is "what the portal does", `docs.md` is "what the portal documents". Editing either one is independent of the other.

## Prerequisites

- Node.js 18+
- A Cloudflare account with Workers enabled
- `wrangler` authenticated (run `wrangler login` once)

## Install

```bash
npm install
```

This pulls `esbuild` and `wrangler` as devDependencies.

## Development

```bash
# Run locally on http://127.0.0.1:8787 with hot reload
npm run dev

# Rebuild the bundle once (output → skill-portal-worker.js)
npm run build

# Rebuild on every source change
npm run build:watch
```

> The build pipeline inlines `src/docs.md` as a JavaScript string variable via `esbuild`'s `--loader:.md=text`. Markdown edits show up in the bundle automatically on next `npm run build`.

## First-time deployment

```bash
# 1. Log in (opens browser for OAuth)
wrangler login

# 2. Deploy (rebuilds + uploads)
npm run deploy
```

After deploy, Cloudflare assigns a `*.workers.dev` URL. The custom domain `skill.022025.xyz` is configured separately in the dashboard under **Workers & Pages → skill-portal → Settings → Triggers**.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| `GET` | `/` | JSON skill registry (name, description, discovery, execution per skill) |
| `GET` | `/docs` | Markdown documentation (served from `src/docs.md`) |
| `ANY` | other | `404` JSON `{ error, path }` |

## Adding or removing a skill

Edit the `SKILLS` array literal near the top of `src/index.js`. Each entry:

```js
{
  name: "skill-name",         // unique id, must match no other skill
  description: "...",
  discovery: {
    type: "url",              // or "remote-shell"
    url: "https://...",        // for type "url"
    hint: "...",
    // OR
    // command: "gh repo view ...",  // for type "remote-shell"
  },
  execution: {
    type: "remote-shell"
  }
}
```

Then `npm run deploy`. Verify by hitting `GET /` and checking the new entry appears.

## Editing the `/docs` page

Edit `src/docs.md`. Pure Markdown — no JS escaping needed. The build inlines it via esbuild's `.md` loader.

> The current `src/docs.md` still says "Modify the `skills` array in the `fetch` function" — slightly outdated after this refactor. Update it to "Modify the `SKILLS` array in `src/index.js`" if you want the docs to track the new structure.

Then `npm run deploy`.

## Verify a deployment

```bash
npm run tail                       # live logs
wrangler versions list             # recent versions
wrangler versions view <id>        # inspect a version
```

Pull the live bundle and diff against your local build:

```bash
# First, build your local bundle (skill-portal-worker.js is git-ignored).
npm run build

# Then pull the live version and compare.
TOKEN=$(grep -oP 'oauth_token\s*=\s*"\K[^"]+' ~/.config/.wrangler/config/default.toml)
ACCOUNT_ID=$(wrangler whoami 2>/dev/null | awk '/Account ID/ {print $NF}')
curl -fsS "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/skill-portal" \
  -H "Authorization: Bearer $TOKEN" -o /tmp/live.bin

python3 -c "
import re
raw = open('/tmp/live.bin', encoding='utf-8', errors='replace').read()
m = re.search(r'name=\"skill-portal-worker\.js\"\r?\n([\s\S]*?)(?:\r?\n--[a-f0-9]+|\Z)', raw)
section = m.group(1)
body_start = section.find('\n\n')
open('/tmp/live-worker.js', 'w').write(section[body_start:].lstrip('\r\n'))
"
diff skill-portal-worker.js /tmp/live-worker.js   # empty if in sync
```

## Settings reference (`settings.json`)

Snapshot taken from `GET /accounts/<id>/workers/scripts/skill-portal/settings`. Reproduce these values when deploying from a clean slate:

| Field | Value | How |
|---|---|---|
| `compatibility_date` | `2026-06-18` | `wrangler.toml` |
| `compatibility_flags` | *(none)* | `wrangler.toml` |
| `usage_model` | `standard` | Dashboard: Settings → Usage Model |
| Bindings | *(none)* | n/a |

## Troubleshooting

- **`npm run dev` fails with "missing worker entrypoint or assets directory"** — `wrangler.toml` is missing or `main` is wrong. Confirm `main = "skill-portal-worker.js"` exists.
- **`wrangler deploy` fails with "skill-portal-worker.js not found"** — bundle is git-ignored. Run `npm run build` first, or use `npm run deploy` which builds automatically.
- **`/docs` returns empty or garbled content** — esbuild's `.md` loader not applied. Check the build script in `package.json` includes `--loader:.md=text`.
- **`/nope` returns skills JSON instead of 404** — your bundle predates the refactor. Run `npm run build && npm run deploy`.
- **Edited `src/docs.md` but `/docs` still shows old content** — you forgot to rebuild. `npm run build` (or `npm run deploy` which builds automatically).

## Security notes

- The portal exposes **registration metadata only** (skill names, URLs, commands). It does not contain bearer tokens, S3 credentials, or other secrets.
- The remote shell endpoint referenced by `execution.remote-shell` requires a bearer token. That token is never stored in this Worker — request it from the portal owner.
- `settings.json` contains no secrets (no bindings configured for this Worker).

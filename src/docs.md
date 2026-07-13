Service that aggregates documentation references for agent skills across projects.

## Endpoints

- `/` — Returns a JSON list of available skills with their access information.
- `/docs` — This page. Documentation about the skill portal itself.

## Schema (v2)

Each skill entry contains `discovery` and `execution` blocks describing how to find and run its source of truth.

### discovery.type: `url`
Public repository docs discoverable via a URL endpoint.
- `url` — API endpoint that returns a directory listing.
- `hint` — Guidance on how to use the url.

### discovery.type: `remote-shell`
Resource accessible via a command on the remote shell (`https://shell.022025.xyz`).
- `command` — The exact command to run.
- `hint` — Guidance on how to use the command.

### execution.type: `remote-shell`
Skill execution happens via the remote shell endpoint.

## Skills

Retrieve `/` for the current list of skills.

## Maintaining the skill portal

To add, remove, or update skills:

1. **Pull the current worker code via API:**
   ```
   TOKEN=$(grep oauth_token ~/.config/.wrangler/config/default.toml | cut -d'"' -f2)
   ACCOUNT=$(npx wrangler whoami 2>/dev/null | grep "Account ID" | awk '{print $NF}')
   curl -s -H "Authorization: Bearer $TOKEN"      "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/scripts/skill-portal"
   ```

2. **Edit the worker code** — Modify the `skills` array in the `fetch` function.

3. **Deploy the updated worker:**
   ```
   npx wrangler deploy /path/to/worker.js --name skill-portal --compatibility-date 2026-06-18
   ```

> Tip: Keep a local git repository of this worker's source code so you can pull, edit, and redeploy easily.

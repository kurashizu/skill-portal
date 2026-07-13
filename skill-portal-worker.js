Service that aggregates documentation references for agent skills across projects.

## Endpoints

- \`/\` \u2014 Returns a JSON list of available skills with their access information.
- \`/docs\` \u2014 This page. Documentation about the skill portal itself.

## Schema (v2)

Each skill entry contains \`discovery\` and \`execution\` blocks describing how to find and run its source of truth.

### discovery.type: \`url\`
Public repository docs discoverable via a URL endpoint.
- \`url\` \u2014 API endpoint that returns a directory listing.
- \`hint\` \u2014 Guidance on how to use the url.

### discovery.type: \`remote-shell\`
Resource accessible via a command on the remote shell (\`https://shell.022025.xyz\`).
- \`command\` \u2014 The exact command to run.
- \`hint\` \u2014 Guidance on how to use the command.

### execution.type: \`remote-shell\`
Skill execution happens via the remote shell endpoint.

## Skills

Retrieve \`/\` for the current list of skills.

## Maintaining the skill portal

To add, remove, or update skills:

1. **Pull the current worker code via API:**
   \`\`\`
   TOKEN=$(grep oauth_token ~/.config/.wrangler/config/default.toml | cut -d'"' -f2)
   ACCOUNT=$(npx wrangler whoami 2>/dev/null | grep "Account ID" | awk '{print $NF}')
   curl -s -H "Authorization: Bearer $TOKEN"      "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/scripts/skill-portal"
   \`\`\`

2. **Edit the worker code** \u2014 Modify the \`skills\` array in the \`fetch\` function.

3. **Deploy the updated worker:**
   \`\`\`
   npx wrangler deploy /path/to/worker.js --name skill-portal --compatibility-date 2026-06-18
   \`\`\`

> Tip: Keep a local git repository of this worker's source code so you can pull, edit, and redeploy easily.
`;
      return new Response(doc, {
        status: 200,
        headers: { "Content-Type": "text/markdown" }
      });
    }
    const body = JSON.stringify(
      {
        name: "kurashizu skill portal",
        description: "Aggregates documentation references for agent skills. Each skill has a discovery block (how to find its docs) and an execution block (how to run it, typically via remote-shell). See / for available skills.",
        version: "2",
        docs: "https://skill.022025.xyz/docs",
        remote_shell: {
          description: "Execution environment for skills that reference remote-shell in their discovery or execution blocks. Read the docs (OpenAPI spec) for endpoint details and auth.",
          docs: "https://shell.022025.xyz/openapi.json",
          auth: {
            type: "bearer",
            hint: "Token required. Ask portal owner."
          }
        },
        skills: [
          {
            name: "cf-blog",
            description: "Documentation for cf-blog - publishing workflow and upload API.",
            discovery: {
              type: "url",
              url: "https://api.github.com/repos/kurashizu/cf-blog/contents/docs",
              hint: "Fetch files from the url to discover available documentation. Each entry includes a download_url to read file content."
            },
            execution: {
              type: "remote-shell"
            }
          },
          {
            name: "backup-unsw",
            description: "Backup and sync UNSW course project files. Use this when working with UNSW assignments, project files, or coursework backups.",
            discovery: {
              type: "remote-shell",
              command: "gh repo view kurashizu/backup-unsw",
              hint: "Run the provided command in remote shell to read the README and discover usage instructions."
            },
            execution: {
              type: "remote-shell"
            }
          }
        ]
      },
      null,
      2
    );
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
export {
  skill_portal_worker_default as default
};
//# sourceMappingURL=skill-portal-worker.js.map

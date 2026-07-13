// skill-portal Cloudflare Worker.
// Two endpoints:
//   GET /      — JSON registry of skills (name + discovery + execution)
//   GET /docs  — Markdown documentation page (src/docs.md, inlined at build time)
//
// To add a skill: edit the SKILLS array below, then `npm run deploy`.
// To edit the docs page: edit src/docs.md, then `npm run deploy`.
//
// Schema notes:
//   discovery  — single object describing how to find the skill's docs.
//   execution  — array of execution environments the skill can run in.
//                Most skills only run in one environment; the array form
//                covers cases like podcast which runs both locally and
//                in remote-shell.

import DOCS_MARKDOWN from "./docs.md";

const SKILLS = [
  {
    name: "cf-blog",
    description: "Documentation for cf-blog - publishing workflow and upload API.",
    discovery: {
      type: "url",
      url: "https://api.github.com/repos/kurashizu/cf-blog/contents/docs",
      hint: "Fetch files from the url to discover available documentation. Each entry includes a download_url to read file content."
    },
    execution: [{ type: "remote-shell" }]
  },
  {
    name: "backup-unsw",
    description: "Backup and sync UNSW course project files. Use this when working with UNSW assignments, project files, or coursework backups.",
    discovery: {
      type: "remote-shell",
      command: "gh repo view kurashizu/backup-unsw",
      hint: "Run the provided command in remote shell to read the README and discover usage instructions."
    },
    execution: [{ type: "remote-shell" }]
  },
  {
    name: "podcast",
    description: "End-to-end Chinese tech podcast pipeline: research, scripting, edge-TTS, and short-lived share-link delivery.",
    discovery: {
      type: "url",
      url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
      hint: "Fetch the SKILL.md for the full pipeline spec: research sources, script structure, TTS settings, upload protocol, and delivery conventions."
    },
    execution: [
      {
        type: "local",
        hint: "Read src/skills/podcast/SKILL.md in this repo. The docs bundle includes the pipeline spec and any helper scripts alongside the doc."
      },
      {
        type: "remote-shell",
        hint: "Same docs are reachable through the remote shell environment when no local clone is available."
      }
    ]
  }
];

const PORTAL_META = {
  name: "kurashizu skill portal",
  description: "Aggregates documentation references for agent skills. Each skill has a discovery block (how to find its docs) and an execution block (one or more environments the skill can run in, e.g. local or remote-shell). See / for available skills.",
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
  skills: SKILLS
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/docs") {
      return new Response(DOCS_MARKDOWN, {
        status: 200,
        headers: { "Content-Type": "text/markdown" }
      });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(JSON.stringify(PORTAL_META, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "not found", path: url.pathname }, null, 2), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};

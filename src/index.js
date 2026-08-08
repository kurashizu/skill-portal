// skill-portal Cloudflare Worker.
// Endpoints:
//   GET /                  — portal meta + skill list (summary)
//   GET /api/skills        — same skill list, summary only
//   GET /api/skills/{name} — full skill (name + description + discovery + execution)
//   GET /docs              — markdown documentation
// To add a skill: edit SKILLS below, then `npm run deploy`.

import DOCS_MARKDOWN from "./docs.md";

const SKILLS = [
  {
    name: "cf-blog",
    description: "Publishing workflow and upload API for cf-blog.",
    discovery: {
      type: "url",
      url: "https://api.github.com/repos/kurashizu/cf-blog/contents/docs",
      hint: "Fetch files from the url to discover available documentation. Each entry includes a download_url to read file content."
    },
    execution: [{ type: "remote-shell" }]
  },
  {
    name: "backup-unsw",
    description: "Backup and sync UNSW course project files.",
    discovery: {
      type: "remote-shell",
      command: "gh repo view kurashizu/backup-unsw",
      hint: "Run the provided command in remote shell to read the README and discover usage instructions."
    },
    execution: [{ type: "remote-shell" }]
  },
  {
    name: "podcast",
    description: "End-to-end Chinese tech podcast pipeline: research, scripting, edge-TTS, and share-link delivery.",
    discovery: {
      type: "url",
      url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
      hint: "Fetch the SKILL.md for the full pipeline spec: research sources, script structure, TTS settings, upload protocol, and delivery conventions."
    },
    execution: [
      { type: "local", hint: "Read src/skills/podcast/SKILL.md in this repo." },
      { type: "remote-shell", hint: "Same docs reachable through the remote shell environment." }
    ]
  }
];

function summarize(skill) {
  return {
    name: skill.name,
    description: skill.description,
    execution: skill.execution.map(e => ({ type: e.type }))
  };
}

const SKILL_BY_NAME = Object.fromEntries(SKILLS.map(s => [s.name, s]));

const PORTAL_META = {
  name: "kurashizu skill portal",
  version: "2",
  rules: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/kurashizu-rules/SKILL.md",
  docs: "https://skill.022025.xyz/docs",
  remote_shell: "https://shell.022025.xyz/openapi.json",
  skills: SKILLS.map(summarize)
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });

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
      return json(PORTAL_META);
    }

    if (url.pathname === "/api/skills") {
      return json(SKILLS.map(summarize));
    }

    const m = url.pathname.match(/^\/api\/skills\/([^/]+)$/);
    if (m) {
      const skill = SKILL_BY_NAME[m[1]];
      return skill ? json(skill) : json({ error: "not found", name: m[1] }, 404);
    }

    return json({ error: "not found", path: url.pathname }, 404);
  }
};

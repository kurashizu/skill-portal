// skill-portal Cloudflare Worker.
// Endpoints:
//   GET /                  — portal meta + skill list (summary)
//   GET /api/skills        — same skill list, summary only
//   GET /api/skills/{name} — full skill (name + description + discovery + remote_shell)
//   GET /docs              — markdown documentation
// To add a skill: edit SKILLS below, then `npm run deploy`.

import DOCS_MARKDOWN from "./docs.md";

const RULES_URL = "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/kurashizu-rules/SKILL.md";
const REMOTE_SHELL_URL = "https://shell.022025.xyz/openapi.json";

// For skills with a remote-shell-only discovery, `url` points at the GitHub repo
// the agent should read directly (the same source the remote-shell command would fetch).
const SKILLS = [
  {
    name: "cf-blog",
    url: "https://github.com/kurashizu/cf-blog",
    description: "Publishing workflow and upload API for cf-blog.",
    discovery: {
      type: "url",
      url: "https://api.github.com/repos/kurashizu/cf-blog/contents/docs",
      hint: "Fetch files from the url to discover available documentation. Each entry includes a download_url to read file content."
    },
    remote_shell: REMOTE_SHELL_URL
  },
  {
    name: "backup-unsw",
    url: "https://github.com/kurashizu/backup-unsw",
    description: "Backup and sync UNSW course project files.",
    discovery: {
      type: "remote-shell",
      command: "gh repo view kurashizu/backup-unsw",
      hint: "Run the provided command in remote shell to read the README and discover usage instructions."
    },
    remote_shell: REMOTE_SHELL_URL
  },
  {
    name: "podcast",
    url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
    description: "End-to-end Chinese tech podcast pipeline: research, scripting, edge-TTS, and share-link delivery.",
    discovery: {
      type: "url",
      url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
      hint: "Fetch the SKILL.md for the full pipeline spec: research sources, script structure, TTS settings, upload protocol, and delivery conventions."
    },
    remote_shell: REMOTE_SHELL_URL
  }
];

function summarize(skill) {
  return {
    name: skill.name,
    url: skill.url,
    description: skill.description,
    remote_shell: skill.remote_shell
  };
}

const SKILL_BY_NAME = Object.fromEntries(SKILLS.map(s => [s.name, s]));

const PORTAL_META = {
  read_first: RULES_URL,
  name: "kurashizu skill portal",
  version: "2",
  rules: RULES_URL,
  docs: "https://skill.022025.xyz/docs",
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

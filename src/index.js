// skill-portal Cloudflare Worker.
// Endpoints:
//   GET /                  — READ_ME_BEFORE_DOING_ANYTHING + docs + skill list (summary)
//   GET /rules             — markdown for kurashizu-rules (highest-priority skill)
//   GET /api/skills        — same skill list, summary only
//   GET /api/skills/{name} — full skill (name + url + description + discovery)
//   GET /docs              — markdown documentation
// To add a skill: edit SKILLS below, then `npm run deploy`.

import DOCS_MARKDOWN from "./docs.md";
import RULES_MARKDOWN from "./skills/kurashizu-rules/SKILL.md";

const RULES_URL = "https://skill.022025.xyz/rules";

// For skills with a remote-shell-only discovery, `url` points at the GitHub repo
// the agent should read directly (the same source the remote-shell command would fetch).
const SKILLS = [
  {
    name: "remote-shell",
    url: "https://shell.022025.xyz/openapi.json",
    description: "Sandboxed shell backend for executing skills. Bearer-token auth. Read the OpenAPI spec for endpoints and use it to run any skill whose discovery is type \"remote-shell\".",
    discovery: {
      type: "url",
      url: "https://shell.022025.xyz/openapi.json",
      hint: "Fetch the OpenAPI spec for endpoint list and bearer auth header."
    }
  },
  {
    name: "cf-blog",
    url: "https://github.com/kurashizu/cf-blog",
    description: "Publishing workflow and upload API for cf-blog.",
    discovery: {
      type: "url",
      url: "https://api.github.com/repos/kurashizu/cf-blog/contents/docs",
      hint: "Fetch files from the url to discover available documentation. Each entry includes a download_url to read file content."
    }
  },
  {
    name: "backup-unsw",
    url: "https://github.com/kurashizu/backup-unsw",
    description: "Backup and sync UNSW course project files.",
    discovery: {
      type: "remote-shell",
      command: "gh repo view kurashizu/backup-unsw",
      hint: "Run the provided command in remote shell to read the README and discover usage instructions."
    }
  },
  {
    name: "podcast",
    url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
    description: "End-to-end Chinese tech podcast pipeline: research, scripting, edge-TTS, and share-link delivery.",
    discovery: {
      type: "url",
      url: "https://raw.githubusercontent.com/kurashizu/skill-portal/main/src/skills/podcast/SKILL.md",
      hint: "Fetch the SKILL.md for the full pipeline spec: research sources, script structure, TTS settings, upload protocol, and delivery conventions."
    }
  }
];

function summarize(skill) {
  return {
    name: skill.name,
    url: skill.url,
    description: skill.description
  };
}

const SKILL_BY_NAME = Object.fromEntries(SKILLS.map(s => [s.name, s]));

const PORTAL_META = {
  READ_ME_BEFORE_DOING_ANYTHING: RULES_URL,
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

    if (url.pathname === "/rules") {
      return new Response(RULES_MARKDOWN, {
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

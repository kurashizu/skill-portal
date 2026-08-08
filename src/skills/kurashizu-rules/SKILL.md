# kurashizu-rules — Agent 工作偏好与规则

**优先级最高的 skill**。任何 agent 在执行任务前,先读完本文件。

---

## 触发条件

agent 即将为 kurashizu 执行任何任务。在调用工具、产出结论、或开始动手之前,先通读本文件并把以下规则纳入行为。

---

## 联网搜索 / 信息获取

- **Web 搜索**:用 `ddgr` CLI
  ```bash
  ddgr --json -n 10 "your query here"
  ```
- **网页抓取**:用 `curl r.jina.ai/<url>` 拉可读化的页面内容
  ```bash
  curl -sSL "https://r.jina.ai/https://example.com/article"
  ```
  不直接用 `curl <url>` 抓 HTML 自己解析;jina 已经返回干净的 markdown。
- **技术文档**:用 `npx ctx7` 查库 / 框架 / API 文档
  ```bash
  npx ctx7 <library-name>
  ```
  优先用 ctx7 而不是凭印象写 API(签名 / 参数 / 行为可能跟训练数据不一样)。

---

## 仓库 / GitHub 操作

- 所有 GitHub 操作走 `gh` CLI(`kurashizu` 账号已登录)。
- 查仓库:`gh repo view <owner>/<repo>`
- 拉文件:`gh api repos/<owner>/<repo>/contents/<path>`
- 创建 / 改 PR / issue:`gh pr create`, `gh issue create`
- 不要重新 `git remote add` 或自己造 token。
- 危险操作(force push、删分支、删 repo)前先确认。

---

## 与其他 skill 的关系

- 本 skill **必须先于** `cf-blog`、`backup-unsw`、`podcast` 等具体任务 skill 读取。
- 任务与本规则冲突时,以本规则为准。

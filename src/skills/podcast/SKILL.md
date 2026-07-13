# Podcast Producer — 中文技术播客端到端流水线

把"一个技术主题"变成"一段可听的 MP3 播客"的完整流程。覆盖研究→脚本→TTS→合并→上传→交付。

---

## 触发条件

用户请求如"做一个 X 分钟的播客讲 Y"、"录制一期关于 Y 的播客"、"把 Y 整理成可听的播客"。

---

## 项目目录约定

每期播客放在 `podcast-workspace/<主题-slug>/` 子目录下，例如：

```
podcast-workspace/
├── SKILL.md
├── gen-tts.py
└── cf-r2-podcast/            # 一期播客 = 一个子目录
    ├── outline.json          # 大纲
    ├── script.md             # 脚本
    ├── audio/                # TTS 输出（part1/, part2/...）
    │   ├── part1/chunk-1.mp3
    │   ├── part2/chunk-1.mp3
    │   └── ...
    └── final/podcast.mp3     # 合并后的成品
```

`<主题-slug>` 是英文/拼音短横线串，避免空格、斜线、中文（share 服务 key 路径不友好）。

---

## 默认参数

| 参数 | 值 |
|---|---|
| 声音 | `zh-CN-YunjianNeural`（沉稳男声） |
| TTS 速度 | edge-tts 默认（不要 atempo 调速） |
| TTS 引擎 | edge-tts（免费 Edge TTS API） |
| 单块上限 | ≤ 1800 字/块 |
| 上传服务 | share.022025.xyz（基于 presigned S3，分三步：init → PUT → complete） |
| 下载链接 | `https://share.022025.xyz/d/<shareToken>`（4 字符 token，由 complete 返回） |
| 默认 TTL | 604800 秒 = 7 天（最长上限） |
| 合并码率 | 48 kbps mono MP3（≈ 500 KB/分钟） |

---

## 关于字数 / 时长（重要，别死扣）

用户说"1 万到 2 万字"或者"X 分钟的播客"，**只是一个量级指引**，不是一个要精确匹配的硬指标。

执行规则：

1. **尽力按目标写字数写**。能多写就多写，写满上限没问题，但**不要为了凑字数而注水**。
2. **不要来回改稿**。第一次写出来字数在合理范围（比如用户说 2 万字，你写了 1 万到 2 万之间任意值）就直接进入下一步。
3. **不调速**。edge-tts 用默认速度，不允许用 ffmpeg `atempo` 加速或减速。如果时长差点就差点，那是原速。
4. 实际产出的时长完全由字数 + 语速 自然决定，不强求凑齐"X 分钟"。

> 简单说：**字数尽力写够，不反复改稿，不调速**。

---

## Step 1：脚本撰写

### 1a. 调研（写稿前先做）

调研分两步：

**第一步：优先用 r.jina.ai 直抓官方/权威源**

很多主题的核心事实就集中在 3-5 个官方文档页（比如定价、limits、API 参考、发布博客）。先用 `fetch` 工具走 `https://r.jina.ai/<目标网址>` 把这些页面正文抓回来，能立刻拿到最权威、最干净的素材。

> **不要**用 zed 内置的 web_fetch 抓普通 URL，它会返回大量垃圾广告和导航内容。r.jina.ai 返回的是干净 Markdown，正文可读性高十倍。

适合直抓的目标页：
- 官方定价页（拿到最新数字）
- 官方 limits / 配额页
- 官方 API 参考（拿到准确命令名、字段名）
- 官方发布博客（拿到历史背景、设计动机）
- 知名独立博客（Cloudflare blog、AWS blog、Vercel blog 等）

**第二步：用 `ddgr` 搜索补充上下文**

只有当直抓的页面还覆盖不到某些角度（行业对比、争议点、最新事件、用户反馈），才用 `ddgr` 搜 5-10 次。

```bash
ddgr --json -n 8 "Cloudflare Workers Smart Placement region pinning latency"
```

> ⚠️ **ddgr 经常返回 `HTTP Error 202: Accepted` 并给出空结果**。这是上游 Google 限流，不是你的错。遇到这种情况：
> - 换个关键词重试
> - 跳过 ddgr，直接用 `r.jina.ai` 抓取你已知的几个权威链接
> - 不要在 ddgr 上耗超过 2-3 次重试

调研目标：拿到 5-10 条有用素材，记下链接和关键事实。

### 1b. 大纲

写一份 outline.json，确定章节切分。一般建议：

- 5000 字稿：5-7 个主章节，每章 1-2 个小节
- 10000-20000 字稿：8-10 个主章节，每章 1-3 个小节

每个章节要写明**主题**和**大致内容点**，不需要标注时长。

json 大纲示例：

```json
{
  "title": "深度学习中的注意力机制",
  "sections": [
    {
      "title": "开场",
      "content": "引入注意力机制的概念，概述本期播客内容。"
    },
    {
      "title": "第一幕：注意力机制的基本原理",
      "subsections": [
        { "title": "什么是注意力机制", "content": "解释注意力机制的定义和基本思想。" },
        { "title": "数学公式与直觉理解", "content": "通过类比和算例解释 softmax 注意力。" }
      ]
    },
    {
      "title": "第二幕：注意力机制的应用",
      "subsections": [
        { "title": "在 NLP 中的应用", "content": "机器翻译、文本生成等。" },
        { "title": "在 CV 中的应用", "content": "图像识别、目标检测。" }
      ]
    },
    {
      "title": "第三幕：对比与挑战",
      "subsections": [
        { "title": "与传统方法的对比", "content": "与 CNN 的优劣。" },
        { "title": "挑战与未来方向", "content": "实际应用中的问题与未来研究。" }
      ]
    },
    {
      "title": "收尾",
      "content": "回顾要点，提出下一步学习建议。"
    }
  ]
}
```

### 1c. 撰稿

根据 outline.json 写口播脚本 `script.md`。

**结构**：

- `## 开场`：主题引入 + 节目导览
- `## 第一幕` / `## 第二幕` / `## 第三幕` ... 主体内容
- `## 收尾`：要点回顾 + 下一步建议

不再需要在结构里写"几分钟"。

**风格**：

- 口语化（"咱们"、"你想象一下"、"有个反直觉的点"）
- 直觉先行 → 类比 → 公式
- 关键数学点用具体数值算例

**显式分节标记**：用 `## 开场` `## 第一幕` ... `## 收尾`（TTS 生成时按这些标记切分）。

**禁忌**：

- 不能有 markdown 表格 / 代码块 / 引用标记——是朗读稿
- `##` 不要出现在正文中（只能作为分节标题），否则会被 gen-tts.py 误判为分界点

**默认行为提醒：`gen-tts.py` 会把 `##` 标题原文喂给 TTS**。所以 TTS 会念出 "第一幕 理解 Cloudflare Workers 的本质" 这种章节名作为段落开头。如果你不希望听这些标题：

**方案 A（推荐）：写脚本时不写标题**

在 `script.md` 里只保留一个 `## 开场`（这能让 `gen-tts.py` 正确切出 part 1），幕与幕之间用口语过渡句衔接，不写 `##`：

```markdown
## 开场

大家好，欢迎收听本期播客。今天我们来聊...

（中间段落，正常写）

好，讲完背景。接下来我们进入第二幕...

（中间段落，正常写）

## 收尾

今天我们讲了一堆要点...（收尾）
```

TTS 不会念出"开场"和"收尾"以外的任何标题，听感上更像正常口语节目。

**方案 B：修 `gen-tts.py`，让它在合成时跳过 header 行**

如果你想让章节结构清晰（比如多幕剧本），但又不想 TTS 念出标题，可以在 `gen-tts.py` 的 `synthesize` 调用前手动剔除每段文本开头的 `## ...` 行。常见做法：在 `split_script` 末尾把每个 chunk 的 header 行删掉。

具体改动是 `gen-tts.py` 里 `result.append((f"{part_name}", header + "\n" + body, 1))` 这一行——把 `header + "\n" + body` 改成只传 `body`。这样 TTS 不会念章节名，但脚本文件的结构仍能保留 `##`。

> 上面哪个方案由你拍板，不在 SKILL 默认流程里强求。SKILL 只默认"按方案 A 写脚本"作为最简路径。

**数学符号转口语**：

- `d_k` → "根号 d k"
- `softmax(QK^T/√d_k)V` → "softmax(QK 转置除以根号 d k) 乘 V"
- `d_model` → "d model"
- `N=6` → "N 等于 6"

### 1d. 字数核对（只看不改）

写完后用 python3 快速估一下字数：

```bash
python3 -c "
import re
with open('cf-r2-podcast/script.md', encoding='utf-8') as f:
    text = f.read()
chinese = re.findall(r'[\u4e00-\u9fff]', text)
print(f'中文字数: {len(chinese)}')
print(f'总字符数(含标题、英文、数字): {len(text)}')
"
```

经验值（中文技术播客，zh-CN-YunjianNeural 默认语速）：
- 1 万中文字 ≈ 25-30 分钟 mp3（48 kbps）
- 2 万中文字 ≈ 50-60 分钟 mp3
- 中文越多占比越高，最终 mp3 越小

> 提醒：第一次写出来的字数在目标量级范围内，就直接进 Step 2。**不要反复改稿去凑数字**。

---

## Step 2：TTS 合成

### 2a. 脚本切分

gen-tts.py 按所有 `##` 标记把脚本切为 N 个 part，每 part 再按 ≤ 1800 字切成若干 chunk。

目录结构：`audio/part1/chunk-1.mp3, audio/part1/chunk-2.mp3, ...`

### 2b. 生成 TTS

直接 `python3 gen-tts.py script.md`，VOICE 用默认，**rate 不要设置**（让它跑默认速度）。

### 2c. 踩过的坑

- TTS 不接受 LaTeX 公式，全部转口语
- 每个 chunk 之间自然有静音停顿，符合口播节奏
- chunk 内不要塞 `[停顿]` 文字——靠 batch 边界自然停顿
- `##` 标记不要在正文段落中出现，否则 gen-tts.py 会误判为分界点
- 脚本切分时以所有 `##` 为边界，不限于 3 部分

---

## Step 3：音频合并

用 ffmpeg concat 把所有 chunk 合并成一个 mp3。

**注意：concat-list 必须按 part+chunk 顺序穷举所有音频文件。**

最稳的方式：用 Python 按自然顺序生成 concat-list，比如：

```python
import os, re

base = "/path/to/audio"
parts = sorted(os.listdir(base), key=lambda x: int(re.search(r'\d+', x).group()))

with open("/tmp/concat.txt", "w") as f:
    for p in parts:
        pdir = os.path.join(base, p)
        chunks = sorted(os.listdir(pdir), key=lambda x: int(re.search(r'\d+', x).group()))
        for c in chunks:
            f.write(f"file '{os.path.join(pdir, c)}'\n")
```

合并命令：

```bash
ffmpeg -y -f concat -safe 0 -i /tmp/concat.txt -c:a libmp3lame -b:a 48k final/podcast.mp3
```

### MP3 体积估算

48 kbps mono MP3 ≈ **500 KB/分钟**。`时长(分钟) × 0.5 ≈ 大小(MB)`。

---

## Step 4：上传到 share.022025.xyz

share 服务走 **三段式**：`init` → `PUT` → `complete`。完成后拿到一个 4 字符 `shareToken`，下载链接形如 `https://share.022025.xyz/d/<token>`。

### 4a. init（预签名上传）

```bash
INIT=$(curl -fsS -X POST "https://share.022025.xyz/api/upload/init" \
  -H "Content-Type: application/json" \
  -d "{\"filename\":\"podcast-<title>.mp3\",\"size\":<size>,\"contentType\":\"audio/mpeg\",\"ttl\":604800}")
```

返回：

```json
{
  "mode": "single",
  "uploadId": "ul_xxxx",
  "key": "uploads/2026/07/13/tmp-xxx/podcast-<title>.mp3",
  "url": "https://s3api.022025.xyz/cf-share/...?presigned...",
  "headers": { "Content-Type": "audio/mpeg" },
  "expiresIn": 600
}
```

> 必填字段：`filename`、`size`（字节数）、`contentType`。可选 `ttl`（300–604800，默认 86400）。`size` 必须提前用 `stat -c%s file` 拿到，不能估。

19 MB 的 mp3 一般走 `mode: single`（单次 PUT），不需要走 multipart。

### 4b. PUT 到 S3

```bash
ETAG=$(curl -fsS -X PUT "$URL" -H "Content-Type: audio/mpeg" \
  --data-binary @"final/podcast.mp3" \
  -D - | tr -d '\r' | awk 'tolower($1)=="etag:" {gsub(/"/,"",$2); print $2}')
```

从响应头里扒 `ETag` 字段（去掉引号），后面 complete 要用。

### 4c. complete（铸成分享链接）

```bash
curl -fsS -X POST "https://share.022025.xyz/api/upload/complete" \
  -H "Content-Type: application/json" \
  -d "{\"uploadId\":\"$UID\",\"key\":\"$KEY\",\"filename\":\"podcast-<title>.mp3\",\"size\":<size>,\"contentType\":\"audio/mpeg\",\"etag\":\"$ETAG\",\"ttl\":604800}"
```

返回：

```json
{
  "shareToken": "XXXX",
  "shareUrl": "/d/XXXX",
  "fullUrl": "https://share.022025.xyz/d/XXXX",
  "expiresAt": 1784565058892
}
```

`shareToken` 就是最终交付的 4 字符 ID。

### 4d. 验证

注意：`GET /d/<token>` 返回的是 HTML 下载页（~7KB），不是 mp3。验证要拿真实二进制：

```bash
# 拿到 302 重定向到的 S3 URL
REAL=$(curl -s -o /dev/null -w "%{redirect_url}" "https://share.022025.xyz/api/download/<token>")
curl -fsS "$REAL" -o /tmp/verify.mp3 -w "size=%{size_download}\n"
# 和原文件 md5 对比
md5sum final/podcast.mp3 /tmp/verify.mp3
```

期望：两个 md5 一致，HTTP 200。

### 4e. 一口气脚本（推荐）

把上面三步合并成一个一键脚本：

```bash
FILE="final/podcast.mp3"
TITLE="edge-storage"
TTL=604800
CT="audio/mpeg"

INIT=$(curl -fsS -X POST "https://share.022025.xyz/api/upload/init" \
  -H "Content-Type: application/json" \
  -d "{\"filename\":\"podcast-${TITLE}.mp3\",\"size\":$(stat -c%s "$FILE"),\"contentType\":\"${CT}\",\"ttl\":${TTL}}")

URL=$(echo "$INIT"  | python3 -c "import json,sys; print(json.load(sys.stdin)['url'])")
KEY=$(echo "$INIT"  | python3 -c "import json,sys; print(json.load(sys.stdin)['key'])")
# 注意：不能用 UID 这个变量名——UID 是 bash 的 readonly 系统变量，赋值会被静默吞掉
UPLOAD_ID=$(echo "$INIT"  | python3 -c "import json,sys; print(json.load(sys.stdin)['uploadId'])")

ETAG=$(curl -fsS -X PUT "$URL" -H "Content-Type: audio/mpeg" \
  --data-binary @"$FILE" -D - | tr -d '\r' \
  | awk 'tolower($1)=="etag:" {gsub(/"/,"",$2); print $2}')

curl -fsS -X POST "https://share.022025.xyz/api/upload/complete" \
  -H "Content-Type: application/json" \
  -d "{\"uploadId\":\"$UPLOAD_ID\",\"key\":\"$KEY\",\"filename\":\"podcast-${TITLE}.mp3\",\"size\":$(stat -c%s "$FILE"),\"contentType\":\"${CT}\",\"etag\":\"$ETAG\",\"ttl\":${TTL}}"
```

最后那段 complete 的 JSON 就是交付用的，里面有 `fullUrl`。

> ⚠️ **踩过的坑**：变量名不要用 `UID`。在 bash 里 `UID` 是 readonly 的进程用户 ID（通常是 1000），你赋给它值时 shell 会静默失败，整个 complete 请求里 `uploadId` 字段就被传成了"1000"，上传可能依然返回 200（接口宽容处理），但这其实是脏数据。**统一用 `UPLOAD_ID` 这种带语义的名字**。

### 命名约定

- 最终文件名：`podcast-<title>.mp3`（用 `-` 代替 `/`，避免 key 路径问题）
- 只上传 mp3，不传脚本/研究材料
- 不要把每次生成的 share token 跟 title 强绑定 1:1，每次都是新的 4 字符

### 限制（文档里的硬性限制）

- 单文件 ≤ 5 GB
- TTL 范围 5min–7 天
- 单 IP 每旦上传：10 GB 总 / 100 个文件
- S3 池总：100 GB（所有有效分享合计）
- 预签名 PUT 10 分钟，GET 5 分钟

---

## Step 5：交付给用户

只需要一件事：**用 Markdown 链接格式输出下载 URL**，不要使用 `<deliver-assets>` 之类的标签。

上传完成后，complete 接口会返回一个 `fullUrl`，格式：

```
https://share.022025.xyz/d/<shareToken>
```

交付模板（把 `<fullUrl>` 换成实际 URL）：

```markdown
**🎙 播客已交付：**

🔗 [下载链接](<fullUrl>)

- 时长：XX 分 XX 秒
- 大小：XX MB
- 内容：<一句话简介>
```

提醒一下：
- `<fullUrl>` 指向的 `/d/<token>` 是 HTML 网页；浏览器打开后点页面上的下载按钮拿到 mp3。
- 如果用户要直接拿二进制链接，引导他用 `GET /api/download/<token>` 拿 302 重定向后的 S3 URL。

---

## Checklist（每次必做）

- [ ] 创建本期子目录 `podcast-workspace/<slug>/`，所有产物都放这里
- [ ] 写稿前先调研（优先 r.jina.ai 直抓官方文档，ddgr 作为补充）
- [ ] 脚本字数尽力按目标写（不强求精确，不反复改稿）
- [ ] 脚本中所有数学符号已转为口语化
- [ ] 脚本有显式分节标记（`##`），且正文段落中不出现额外 `##`
- [ ] TTS 用默认速度合成（不要 atempo 调速）
- [ ] 只上传 mp3，不传其他文件
- [ ] 上传走完整三步（init → PUT → complete），拿到 shareToken
- [ ] 上传变量名不要用 `UID`（bash readonly），用 `UPLOAD_ID`
- [ ] 验证 `GET /api/download/<token>` 能拿到原文件（md5 一致）
- [ ] 交付用 Markdown 链接格式输出下载 URL
- [ ] 临时文件 `/tmp/concat.txt` `/tmp/verify.mp3` 在交付后清理

---

## 失败模式与对策

| 失败 | 原因 | 对策 |
|---|---|---|
| TTS 段被截断 | 文本超长/含特殊字符 | 切小块；公式改口语；避免连续长段落 |
| 合并时找不到部分文件 | concat-list 漏写 chunk | 用脚本按 part/chunk 自然顺序穷举 |
| 合并顺序错 | concat-list 顺序乱 | 按 part1→part2→... 的 chunk-1, chunk-2,... 写 |
| init 返回 size 报错 | size 字段丢失或为字符串 | 用 `stat -c%s` 拿数字，别用字符串 |
| init 返回 400 | filename/size/contentType 缺一个 | 三个必填，不能漏 |
| PUT 后拿不到 ETag | `-D -` 没加，或只用了 `-o` | 取消 `-o`，加 `-D -` 打响应头 |
| complete 返回 401 | ETag 有引号没去掉 | `awk` 里 gsub 把引号、空格都剥干净 |
| `/d/<token>` 返回 HTML 而不是 mp3 | 路由本来就是 HTML 下载页 | 想拿 mp3 用 `/api/download/<token>` 走 302 |
| Token 过期 | TTL 设太短 或 超过有效期 | 上传后马上交付，别拖；最长 7 天 |
| 合并文件找不到 | 路径相对错误 | concat-list 用绝对路径 |
| gen-tts.py 报错切分异常 | 正文中出现 `##` 标记 | 移除正文中的 `##`，改用其他强调方式 |
| TTS 输出只有最后一段有效 | gen-tts.py 把每个 part 的多 chunk 都写成同一文件名覆盖 | 修 gen-tts.py，让每个 chunk 输出独立文件名 |
| TTS 念出"开场"、"第一幕 ..." 等章节名 | `gen-tts.py` 把每 part 的 header 行也作为 chunk 文本传入 synthesize | 写脚本时只用一句口语过渡句代替 `##` 标题；或者改 `gen-tts.py` 让它合成前跳过 header 行 |
| ddgr 返回空结果（`HTTP Error 202: Accepted`） | Google 限流，不是你的错 | 跳过 ddgr，直接用 `r.jina.ai` 抓你已知的几个权威 URL |
| 上传时 uploadId 被填成 `1000` 但仍然 200 | bash 里 `UID` 是 readonly 变量，赋值静默失败 | 变量改名 `UPLOAD_ID` |
| 生成的 mp3 是 0 字节或只有几秒 | TTS 段没生成完（网络中断），但 ffmpeg concat 用了空文件 | 重跑 `gen-tts.py` 后再合并；合并前先 `ls -lh audio/part*/chunk-*.mp3` 看大小 |

---

## 时间预算

| 步骤 | 预计耗时 |
|---|---|
| 调研（ddgr + r.jina.ai） | 10-15 分钟 |
| 脚本撰写 | 15-25 分钟（一次写完，不反复改） |
| TTS 合成（5-15 块） | 3-15 分钟 |
| 合并 | <30 秒 |
| 上传（init + PUT + complete） | 10-60 秒 |
| **合计** | **30-55 分钟** |

> ⚠️ 之前踩过的坑：反复改稿到精确字数、用 atempo 调速去凑时长，都是浪费。**尽力写够字数 → 默认速度合成 → 合并 → share.022025.xyz 三步上传 → 交付**，这样最省事。

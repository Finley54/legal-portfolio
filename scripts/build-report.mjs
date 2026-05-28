import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [sourcePath, outputPath] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  console.error("Usage: node scripts/build-report.mjs <source.md> <output.html>");
  process.exit(1);
}

const markdown = await readFile(sourcePath, "utf8");
const parsed = parseMarkdown(markdown);
const html = renderPage(parsed);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, "utf8");

function parseMarkdown(input) {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const toc = [];
  const body = [];
  let title = "研究报告";
  let sectionIndex = 0;

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level === 1) {
        title = stripMarkdown(text);
      } else {
        sectionIndex += 1;
        const id = `section-${sectionIndex}`;
        toc.push({ level, text: stripMarkdown(text), id });
        body.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      }
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      body.push("<hr />");
      i += 1;
      continue;
    }

    if (/^`{3,}/.test(line.trim())) {
      const fence = line.trim().match(/^`+/)[0];
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      body.push(renderCode(code.join("\n")));
      continue;
    }

    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      body.push(renderCallout(quote));
      continue;
    }

    if (line.trim().startsWith("|")) {
      const table = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        table.push(lines[i].trim());
        i += 1;
      }
      body.push(renderTable(table));
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i += 1;
      }
      body.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const orderedStart = /^\s*(\d+)\.\s+/.exec(line);
    if (orderedStart) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      const start = Number(orderedStart[1]);
      const startAttr = start === 1 ? "" : ` start="${start}"`;
      body.push(`<ol${startAttr}>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^`{3,}/.test(lines[i].trim()) &&
      !lines[i].startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*-\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    body.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return { title, toc, body: body.join("\n") };
}

function renderPage({ title, toc, body }) {
  const tocHtml = toc
    .filter((item) => item.level <= 3)
    .map((item) => `<a class="toc-level-${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`)
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(title)}，李子礽互联网法与数据合规研究报告 demo。" />
    <title>${escapeHtml(title)} | 李子礽研究报告</title>
    <link rel="stylesheet" href="../styles.css" />
    <link rel="stylesheet" href="report.css" />
  </head>
  <body class="report-page">
    <div class="site-noise" aria-hidden="true"></div>

    <header class="report-topbar">
      <a class="brand" href="../index.html#reports" aria-label="返回作品集研究区">
        <span class="brand-mark">§</span>
        <span>
          <strong>李子礽</strong>
          <small>Research Demo</small>
        </span>
      </a>
      <a class="back-link" href="../index.html#reports">返回作品集</a>
    </header>

    <main>
      <section class="report-hero">
        <p class="eyebrow">Platform Governance / PIPL / Notice-and-Takedown</p>
        <h1>${escapeHtml(title)}</h1>
        <p>
          比较民法典通知删除规则与 PIPL 删除权在请求前提、举证责任、反通知机制、归责逻辑和救济路径上的差异，并讨论二者在平台个人信息传播场景下的竞合。
        </p>
        <div class="report-tags" aria-label="报告关键词">
          <span>平台治理</span>
          <span>PIPL 删除权</span>
          <span>通知删除</span>
          <span>数据合规</span>
        </div>
      </section>

      <div class="report-shell">
        <aside class="report-toc" aria-label="报告目录">
          <strong>目录</strong>
          ${tocHtml}
        </aside>

        <article class="report-article">
${body}
        </article>
      </div>
    </main>

    <script src="report.js"></script>
  </body>
</html>
`;
}

function renderTable(rows) {
  const parsed = rows
    .map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
    .filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));

  if (!parsed.length) return "";
  const [head, ...body] = parsed;
  return `<div class="table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${inline(cell)}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderCallout(lines) {
  const raw = lines.join("\n").trim();
  const obsidian = /^\[!(\w+)\][+-]?\s*(.*)$/i.exec(lines[0] || "");
  if (obsidian) {
    const kind = obsidian[1].toLowerCase();
    const title = obsidian[2] || titleCase(kind);
    const rest = lines.slice(1).join("\n").trim();
    return `<aside class="callout callout-${kind}"><div class="callout-title"><span>!</span>${escapeHtml(
      title,
    )}</div>${renderLooseMarkdown(rest)}</aside>`;
  }

  const insight = /^\*\*([^*]+)\*\*[:：]?\s*(.*)$/s.exec(raw);
  if (insight) {
    return `<aside class="callout callout-insight"><div class="callout-title"><span>!</span>${inline(
      insight[1],
    )}</div><p>${inline(insight[2])}</p></aside>`;
  }

  return `<blockquote>${renderLooseMarkdown(raw)}</blockquote>`;
}

function renderCode(code) {
  const lines = code
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 4 && lines.some((line) => line.includes("→"))) {
    const rows = lines
      .map((line) => {
        const [label, rest = ""] = line.split(/[:：]/);
        return `<div class="flow-row"><strong>${escapeHtml(label.trim())}</strong><span>${inline(
          rest.trim(),
        )}</span></div>`;
      })
      .join("");
    return `<div class="rule-flow">${rows}</div>`;
  }
  return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

function renderLooseMarkdown(text) {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${inline(block.replace(/\n/g, " "))}</p>`)
    .join("");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function stripMarkdown(text) {
  return text.replace(/\*\*/g, "").replace(/`/g, "");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

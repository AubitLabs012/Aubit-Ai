const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const root = path.resolve(__dirname, "..");
const inputPath = path.resolve(root, process.argv[2] || "AUBIT_PROJECT_REPORT.md");
const outputPath = path.resolve(root, process.argv[3] || "AUBIT_PROJECT_REPORT.pdf");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => inlineMarkdown(cell.trim())));

  const [head, ...body] = rows;
  return [
    "<table>",
    head ? `<thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>` : "",
    body.length ? `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>` : "",
    "</table>",
  ].join("");
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let table = [];
  let inCode = false;

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  }

  function flushTable() {
    if (table.length) {
      html.push(renderTable(table));
      table = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        flushTable();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }

    flushTable();

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      list.push(ordered[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();
  return html.join("\n");
}

function buildHtml(markdown) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(path.basename(inputPath, path.extname(inputPath)).replace(/_/g, " "))}</title>
  <style>
    @page { margin: 22mm 18mm; }
    body {
      font-family: "Times New Roman", Georgia, serif;
      color: #111;
      font-size: 12pt;
      line-height: 1.45;
    }
    h1 {
      text-align: center;
      font-size: 20pt;
      margin: 0 0 24pt;
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      margin: 22pt 0 12pt;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    h3 {
      font-size: 14pt;
      margin: 16pt 0 8pt;
      page-break-after: avoid;
    }
    h4 {
      font-size: 12.5pt;
      margin: 12pt 0 6pt;
      page-break-after: avoid;
    }
    p { margin: 0 0 9pt; text-align: justify; }
    ul { margin: 0 0 10pt 22pt; padding: 0; }
    li { margin: 3pt 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt;
      font-size: 10.5pt;
    }
    th, td {
      border: 1px solid #444;
      padding: 6pt;
      vertical-align: top;
    }
    th { background: #efefef; font-weight: bold; }
    pre {
      border: 1px solid #bbb;
      background: #f7f7f7;
      padding: 8pt;
      white-space: pre-wrap;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    code { font-family: Consolas, "Courier New", monospace; font-size: 10pt; }
  </style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>`;
}

async function main() {
  const markdown = fs.readFileSync(inputPath, "utf8");
  const html = buildHtml(markdown);

  await app.whenReady();
  const window = new BrowserWindow({
    width: 1240,
    height: 1754,
    show: false,
    webPreferences: {
      sandbox: true,
    },
  });

  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdf = await window.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    marginsType: 0,
  });
  fs.writeFileSync(outputPath, pdf);
  window.destroy();
  app.quit();
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exitCode = 1;
});

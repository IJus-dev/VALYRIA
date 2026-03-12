import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceRoots = [
  path.join(rootDir, "apps", "web", "app"),
  path.join(rootDir, "apps", "web", "components"),
  path.join(rootDir, "apps", "web", "lib")
];

const allowedFiles = new Set([
  path.join(rootDir, "apps", "web", "app", "globals.css"),
  path.join(rootDir, "apps", "web", "design-tokens.ts"),
  path.join(rootDir, "apps", "web", "tailwind.config.ts")
]);

const fileExtensions = new Set([".ts", ".tsx", ".css"]);

const rules = [
  {
    name: "raw hex color",
    pattern: /#[0-9a-fA-F]{3,8}\b/g
  },
  {
    name: "raw rgb/rgba color",
    pattern: /\brgba?\(/g
  },
  {
    name: "raw px value",
    pattern: /\b\d+(?:\.\d+)?px\b/g
  },
  {
    name: "Tailwind arbitrary px value",
    pattern: /\[[^\]\n]*\d+(?:\.\d+)?px[^\]\n]*\]/g
  }
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
      continue;
    }

    if (fileExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

async function main() {
  const files = (await Promise.all(sourceRoots.map((dir) => walk(dir)))).flat();
  const issues = [];

  for (const filePath of files) {
    if (allowedFiles.has(filePath)) {
      continue;
    }

    const content = await readFile(filePath, "utf8");

    for (const rule of rules) {
      for (const match of content.matchAll(rule.pattern)) {
        issues.push({
          filePath,
          line: getLineNumber(content, match.index ?? 0),
          rule: rule.name,
          value: match[0]
        });
      }
    }
  }

  if (issues.length > 0) {
    console.error("Design system lint failed. Use tokens or primitives instead of one-off values.\n");

    for (const issue of issues) {
      const relativePath = path.relative(rootDir, issue.filePath);
      console.error(`${relativePath}:${issue.line} ${issue.rule} -> ${issue.value}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("Design system lint passed.");
}

await main();

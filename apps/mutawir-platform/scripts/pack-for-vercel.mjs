import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const root = process.cwd();

const textGlobs = execSync(
  `find src public -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.gitkeep" \\) | sort`,
  { cwd: root }
)
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean);

const configFiles = [
  "package.json",
  "tsconfig.json",
  "next.config.mjs",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "prisma/schema.prisma",
];

const binaryFiles = ["public/brand/logo-full.png", "public/brand/logo-icon.png", "public/brand/icon-32.png", "public/brand/icon-180.png"];

const files = [];
for (const rel of [...configFiles, ...textGlobs]) {
  if (binaryFiles.includes(rel)) continue;
  const data = readFileSync(path.join(root, rel), "utf-8");
  files.push({ file: rel, data });
}
for (const rel of binaryFiles) {
  const data = readFileSync(path.join(root, rel)).toString("base64");
  files.push({ file: rel, data, encoding: "base64" });
}

writeFileSync("/tmp/vercel-files.json", JSON.stringify(files));
console.log("files:", files.length);
console.log("bytes:", JSON.stringify(files).length);

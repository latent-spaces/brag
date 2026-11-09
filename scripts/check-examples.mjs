#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXAMPLE_PAGES = [
  "examples/bicycles-for-snakes/index.html",
  "examples/fish-flight-school/index.html",
  "examples/horse-tinder/index.html",
  "examples/psychologists-for-chatbots/index.html",
  "examples/taxi-for-taxis/index.html",
  "docs/examples/fish-flight-school/index.html",
  "docs/examples/horse-tinder/index.html",
  "docs/examples/taxi-for-taxis/index.html",
  "docs/examples/full/fish-flight-school/index.html",
  "docs/examples/full/horse-tinder/index.html",
  "docs/examples/full/taxi-for-taxis/index.html",
];

export function examplePageProblems(html, { cssExists }) {
  const problems = [];
  if (!/<html\b[^>]*\blang=/.test(html)) problems.push("missing lang");
  if (!/<meta\s+charset=/i.test(html)) problems.push("missing charset");
  if (!/name=["']viewport["']/i.test(html)) problems.push("missing viewport");
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push("missing title");
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  if (!description?.[1].trim()) problems.push("missing meta description");
  if (!cssExists) problems.push("missing styles.css");
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const problems = [];
  for (const page of EXAMPLE_PAGES) {
    const html = await readFile(path.join(root, page), "utf8");
    const css = path.join(root, path.dirname(page), "styles.css");
    let cssExists = true;
    try {
      await access(css);
    } catch {
      cssExists = false;
    }
    for (const problem of examplePageProblems(html, { cssExists })) {
      problems.push(`${page}: ${problem}`);
    }
  }
  if (problems.length > 0) {
    console.error("Example page check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Example page check passed: ${EXAMPLE_PAGES.length} pages.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();

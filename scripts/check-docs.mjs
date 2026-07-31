#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");
const indexPath = path.join(docsDir, "index.html");

const numberWords = new Map([
  ["zero", 0],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10],
]);

const failures = [];
const html = await readFile(indexPath, "utf8");

function isLocalReference(value) {
  return (
    value &&
    !value.startsWith("#") &&
    !value.startsWith("//") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(value)
  );
}

function localPathFor(value) {
  const clean = value.split(/[?#]/, 1)[0];
  return path.join(docsDir, clean);
}

function parseCount(value) {
  const normalized = value.toLowerCase();
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return numberWords.get(normalized);
}

for (const match of html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)) {
  const reference = match[1];
  if (!isLocalReference(reference)) continue;

  const target = localPathFor(reference);
  if (!existsSync(target)) {
    failures.push(`Missing local reference: ${reference}`);
  }
}

const galleryVideos = [
  ...html.matchAll(/<video\b[^>]*class=["'][^"']*\bbrag-video\b[^"']*["'][\s\S]*?<\/video>/g),
];
const galleryCount = galleryVideos.length;

const galleryCopy = html.match(/>([^<>]*?)\s+real projects\s+.\s+([^<>]*?)\s+real brags</i);
if (!galleryCopy) {
  failures.push("Could not find gallery count copy.");
} else {
  const projectCount = parseCount(galleryCopy[1].trim());
  const bragCount = parseCount(galleryCopy[2].trim());

  if (projectCount !== galleryCount || bragCount !== galleryCount) {
    failures.push(
      `Gallery copy says ${galleryCopy[1].trim()} projects and ${galleryCopy[2].trim()} brags, but ${galleryCount} brag videos are listed.`,
    );
  }
}

for (const video of galleryVideos) {
  const tag = video[0];
  const src = tag.match(/\bsrc=["']([^"']+)["']/)?.[1];
  const poster = tag.match(/\bposter=["']([^"']+)["']/)?.[1];

  if (!src) failures.push("Gallery video is missing src.");
  if (!poster) failures.push(`Gallery video ${src ?? "(unknown)"} is missing poster.`);

  if (!src) continue;
  const siteThumb = src.replace(/brag\.mp4(?:[?#].*)?$/, "site.jpg");
  if (siteThumb === src || !existsSync(localPathFor(siteThumb))) {
    failures.push(`Gallery video ${src} is missing matching site.jpg.`);
  }
}

if (failures.length > 0) {
  console.error("Docs sanity check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Docs sanity check passed: ${galleryCount} gallery videos and all local references exist.`);

import assert from "node:assert/strict";
import test from "node:test";
import { galleryProblems, galleryVideos } from "./check-gallery.mjs";

const html = `
<video class="brag-video" src="examples/horse-tinder/brag.mp4" aria-label="horse tinder, /brag-slim"></video>
<video class="brag-video" src="examples/full/horse-tinder/brag.mp4" aria-label="horse tinder, /brag --full"></video>
<video class="hero" src="assets/hero.mp4" aria-label="hero"></video>
`;

test("reads only gallery videos", () => {
  assert.equal(galleryVideos(html).length, 2);
});

test("rejects a repeated accessible name", () => {
  const videos = galleryVideos(html.replace("horse tinder, /brag --full", "horse tinder, /brag-slim"));
  assert.equal(galleryProblems(videos).length, 1);
});

test("rejects an empty gallery", () => {
  assert.match(galleryProblems([])[0], /No gallery videos/);
});

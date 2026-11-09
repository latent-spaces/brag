import assert from "node:assert/strict";
import test from "node:test";
import { musicCueProblems } from "./check-music-cues.mjs";

const good = {
  filename: "bed.mp3",
  markdown: "Track: `bed.mp3`",
  data: {
    source: { filename: "bed.mp3", trackStem: "bed" },
    duration: 20,
    tempo: 120,
    beats: [{ time: 0.5 }, { time: 1 }],
    strongCues: [{ time: 0.5 }],
  },
};

test("accepts a minimal cue preset", () => {
  assert.deepEqual(musicCueProblems(good), []);
});

test("rejects an unsorted beat grid and a caption that forgets the filename", () => {
  const problems = musicCueProblems({
    ...good,
    markdown: "no filename here",
    data: { ...good.data, beats: [{ time: 2 }, { time: 1 }] },
  });
  assert.equal(problems.length, 2);
});

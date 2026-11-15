"""Offline regression tests. Run from the repository root with:

uv run --frozen --project skills/brag/scripts python -m unittest discover \
    -s skills/brag/scripts/tests -v
"""

import json
import math
from contextlib import ExitStack
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import analyze_music_cues as analyzer


def cue(time, intensity, kind="strong_beat"):
    return {"time": time, "intensity": intensity, "kind": kind}


class MusicCueTests(unittest.TestCase):
    def analyze(self, beats, onsets=(), start=0.0, duration=25.0, top=10):
        """Exercise output assembly with synthetic detector results, without audio I/O."""
        sr = 51200  # One frame is 0.01s, including near-duplicate test cues.
        scores = {round(time * 100): strength for time, strength in [*beats, *onsets]}

        def score(frame, *unused):
            return {
                "intensity": scores[frame],
                "onsetStrength": 0.0,
                "localOnsetContrast": 0.0,
                "rms": 0.0,
                "bassEnergy": 0.0,
            }

        results = {
            "load": (np.zeros(1), sr),
            "get_duration": 120.0,
            "onset.onset_strength": np.zeros(1),
            "feature.rms": np.zeros((1, 1)),
            "stft": np.zeros((1, 1)),
            "fft_frequencies": np.zeros(1),
            "beat.beat_track": (120.0, np.array([round(t * 100) for t, _ in beats])),
            "onset.onset_detect": np.array([round(t * 100) for t, _ in onsets]),
        }
        with ExitStack() as stack:
            for name, result in results.items():
                stack.enter_context(patch(
                    f"analyze_music_cues.librosa.{name}", return_value=result
                ))
            stack.enter_context(patch.object(analyzer, "_score_frame", side_effect=score))
            return analyzer.analyze_track(Path("synthetic.wav"), start, duration, top, sr)

    @staticmethod
    def section(markdown, heading):
        return markdown.split(f"## {heading}\n\n", 1)[1].split("\n\n", 1)[0]

    def assert_window_matches_markdown(self, data, markdown):
        cues = data["windowStrongCues"]
        expected = "\n".join(f"- {analyzer._format_cue(item)}" for item in cues) or "- none"
        self.assertEqual(self.section(markdown, "Strong Cues In Window"), expected)
        reveals = "\n".join(f"- {analyzer._format_cue(item)}" for item in cues[:5]) or "- none"
        self.assertEqual(self.section(markdown, "Reveal Candidates"), reveals)
        # Confirm the actual serialized values also agree with the summary.
        self.assertEqual(json.loads(json.dumps(data))["windowStrongCues"], cues)

    def test_late_window_survives_global_top_64(self):
        early = [(float(i), 0.9) for i in range(70)]
        late = [(100.0, 0.6), (101.0, 0.7), (102.0, 0.45)]
        data, markdown = self.analyze(early + late, start=100.0, duration=10.0)
        self.assertIn("- 101.00s (0.70, strong_beat)", markdown)
        self.assertEqual([c["time"] for c in data["windowStrongCues"]], [101.0, 100.0, 102.0])
        self.assertEqual(len(data["strongCues"]), 64)
        self.assertTrue(all(c["time"] < 100 for c in data["strongCues"]))
        self.assertEqual(len(data["beats"]), 73)
        self.assert_window_matches_markdown(data, markdown)

    def test_global_selection_and_beats_do_not_depend_on_window(self):
        beats = [(float(i), 0.5 + (i % 10) * 0.04) for i in range(110)]
        default, _ = self.analyze(beats)
        late, _ = self.analyze(beats, start=100.0, duration=20.0, top=2)
        expected = sorted(
            sorted(beats, key=lambda item: item[1], reverse=True)[:64],
            key=lambda item: item[0],
        )
        self.assertEqual([(c["time"], c["intensity"]) for c in default["strongCues"]],
                         [(time, round(strength, 4)) for time, strength in expected])
        self.assertEqual(default["strongCues"], late["strongCues"])
        self.assertEqual(default["beats"], late["beats"])
        self.assertEqual([b["time"] for b in late["beats"]], [t for t, _ in beats])
        self.assertEqual(default["schemaVersion"], 1)
        self.assertEqual(default["scoring"]["strongCueMaxCount"], 64)

    def test_default_window_and_intensity_threshold(self):
        data, markdown = self.analyze([(1.0, 0.44), (2.0, 0.45), (20.0, 0.8), (26.0, 1.0)])
        self.assertEqual([c["time"] for c in data["windowStrongCues"]], [20.0, 2.0])
        self.assertEqual(data["analysis"]["windowStart"], 0.0)
        self.assertEqual(data["analysis"]["windowEnd"], 25.0)
        self.assert_window_matches_markdown(data, markdown)

    def test_empty_and_silent_windows(self):
        for beats, start in [([], 0.0), ([(1.0, 0.0)], 0.0), ([(1.0, 0.9)], 100.0),
                             ([(1.0, 0.9)], 121.0)]:
            with self.subTest(beats=beats, start=start):
                data, markdown = self.analyze(beats, start=start)
                self.assertEqual(data["windowStrongCues"], [])
                self.assertEqual(len(data["beats"]), len(beats))
                self.assert_window_matches_markdown(data, markdown)

    def test_near_duplicate_beat_and_onset_keep_stronger_cue(self):
        data, markdown = self.analyze([(1.0, 0.6), (2.0, 0.7)], [(1.1, 0.9)])
        self.assertEqual([(c["time"], c["kind"]) for c in data["windowStrongCues"]],
                         [(1.1, "onset_peak"), (2.0, "strong_beat")])
        self.assertEqual([c["time"] for c in data["strongCues"]], [1.1, 2.0])
        self.assertEqual([b["time"] for b in data["beats"]], [1.0, 2.0])
        self.assert_window_matches_markdown(data, markdown)

    def test_deduplication_is_stable_across_window_boundary(self):
        data, _ = self.analyze([(99.9, 0.9), (100.0, 0.6), (101.0, 0.7)],
                               start=100.0, duration=5.0)
        self.assertEqual([c["time"] for c in data["strongCues"]], [99.9, 101.0])
        self.assertEqual([c["time"] for c in data["windowStrongCues"]], [101.0])

    def test_top_cues_limits_json_markdown_and_reveals(self):
        beats = [(float(i), 0.5 + i * 0.01) for i in range(15)]
        for top in [0, 1, 3, 10, 20]:
            with self.subTest(top=top):
                data, markdown = self.analyze(beats, top=top)
                expected_times = list(reversed(range(15)))[:top]
                self.assertEqual([c["time"] for c in data["windowStrongCues"]], expected_times)
                self.assert_window_matches_markdown(data, markdown)

    def test_window_top_cues_is_independent_of_global_cap(self):
        data, markdown = self.analyze([(float(i), 0.8) for i in range(100)], duration=120.0, top=80)
        self.assertEqual(len(data["strongCues"]), 64)
        self.assertEqual(len(data["windowStrongCues"]), 80)
        self.assert_window_matches_markdown(data, markdown)

    def test_window_bounds_are_inclusive_and_clipped_to_track(self):
        data, markdown = self.analyze([(99.0, 0.9), (100.0, 0.7), (120.0, 0.8)],
                                      start=100.0, duration=25.0)
        self.assertEqual(data["analysis"]["windowEnd"], 120.0)
        self.assertEqual([c["time"] for c in data["windowStrongCues"]], [120.0, 100.0])
        self.assert_window_matches_markdown(data, markdown)

    def test_times_and_ordering(self):
        data, _ = self.analyze([(1.0, 0.5), (2.0, 0.8), (3.0, 0.6)])
        for key in ["beats", "strongCues", "windowStrongCues"]:
            self.assertTrue(all(math.isfinite(c["time"]) and c["time"] >= 0 for c in data[key]))
        for key in ["beats", "strongCues"]:
            times = [c["time"] for c in data[key]]
            self.assertEqual(times, sorted(times))
        strengths = [c["intensity"] for c in data["windowStrongCues"]]
        self.assertEqual(strengths, sorted(strengths, reverse=True))


class DedupeCueTests(unittest.TestCase):
    def test_duplicates_and_near_duplicates_are_not_repeated(self):
        cues = [cue(1.0, 0.5), cue(1.0, 0.5), cue(1.1, 0.9), cue(2.0, 0.6)]
        self.assertEqual(analyzer._dedupe_cues(cues), [cues[2], cues[3]])

    def test_equal_strength_preserves_original_identity(self):
        beat = cue(1.0, 0.8)
        onset = cue(1.05, 0.8, "onset_peak")
        self.assertEqual(analyzer._dedupe_cues([beat, onset]), [beat])


if __name__ == "__main__":
    unittest.main()

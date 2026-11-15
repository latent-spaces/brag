"""Run: uv run --frozen --project skills/brag/scripts python -m unittest discover -s skills/brag/scripts/tests"""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from analyze_music_cues import _pick_cues


class PickCuesTest(unittest.TestCase):
    def test_late_window_keeps_its_cues_past_the_64_cap(self):
        early = [{"time": float(i), "intensity": 0.9} for i in range(70)]
        late = [{"time": t, "intensity": i} for t, i in [(100.0, 0.6), (101.0, 0.7), (102.0, 0.45)]]
        strong, window = _pick_cues(early + late, 100.0, 110.0, 10)
        self.assertEqual(len(strong), 64)
        self.assertEqual([c["time"] for c in window], [101.0, 100.0, 102.0])


if __name__ == "__main__":
    unittest.main()

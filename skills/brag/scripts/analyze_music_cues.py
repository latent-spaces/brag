#!/usr/bin/env python3
"""Generate music cue metadata (tempo, beat grid, strong cues) for any track.

Used two ways: (1) a maintainer tool to precompute the bundled-track cue
presets, and (2) an optional runtime "extended" beat-sync path for /brag on
any track when Python + librosa are available (see references/audio.md ->
"Beat and cue sources"). When those deps are absent, /brag falls back to
`npx hyperframes beats`. Takes any audio file as input.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import librosa
import numpy as np


HOP_LENGTH = 512
FRAME_LENGTH = 2048
BASS_N_FFT = 4096
BASS_MIN_HZ = 30.0
BASS_MAX_HZ = 180.0


def _as_float(value: Any) -> float:
    array = np.asarray(value)
    if array.size == 0:
        return 0.0
    return float(array.reshape(-1)[0])


def _finite_round(value: float, digits: int = 4) -> float:
    if not math.isfinite(value):
        return 0.0
    return round(float(value), digits)


def _normalize(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=float)
    values = np.nan_to_num(values, nan=0.0, posinf=0.0, neginf=0.0)
    if values.size == 0:
        return values
    values = np.maximum(values, 0.0)
    high = np.percentile(values, 98)
    if high <= 1e-12:
        high = np.max(values)
    if high <= 1e-12:
        return np.zeros_like(values)
    return np.clip(values / high, 0.0, 1.0)


def _feature_at(feature: np.ndarray, frame: int) -> float:
    if feature.size == 0:
        return 0.0
    index = int(np.clip(frame, 0, feature.size - 1))
    return float(feature[index])


def _local_contrast(onset_norm: np.ndarray, frame: int, sr: int) -> float:
    radius = max(1, int(round(0.5 * sr / HOP_LENGTH)))
    start = max(0, frame - radius)
    end = min(onset_norm.size, frame + radius + 1)
    local = onset_norm[start:end]
    if local.size == 0:
        return 0.0
    median = float(np.median(local))
    return max(0.0, _feature_at(onset_norm, frame) - median)


def _score_frame(
    frame: int,
    onset_norm: np.ndarray,
    contrast_norm: np.ndarray,
    rms_norm: np.ndarray,
    bass_norm: np.ndarray,
) -> dict[str, float]:
    onset = _feature_at(onset_norm, frame)
    contrast = _feature_at(contrast_norm, frame)
    rms = _feature_at(rms_norm, frame)
    bass = _feature_at(bass_norm, frame)
    intensity = 0.45 * onset + 0.25 * contrast + 0.20 * rms + 0.10 * bass
    return {
        "intensity": float(np.clip(intensity, 0.0, 1.0)),
        "onsetStrength": onset,
        "localOnsetContrast": contrast,
        "rms": rms,
        "bassEnergy": bass,
    }


def _dedupe_cues(cues: list[dict[str, Any]], min_gap: float = 0.18) -> list[dict[str, Any]]:
    sorted_by_strength = sorted(cues, key=lambda item: item["intensity"], reverse=True)
    accepted: list[dict[str, Any]] = []
    for cue in sorted_by_strength:
        if all(abs(cue["time"] - existing["time"]) >= min_gap for existing in accepted):
            accepted.append(cue)
    return sorted(accepted, key=lambda item: item["time"])


def _compact_times(items: list[dict[str, Any]], max_items: int = 48) -> str:
    subset = items[:max_items]
    text = ", ".join(f"{item['time']:.2f}" for item in subset)
    if len(items) > max_items:
        text += f", ... (+{len(items) - max_items} more)"
    return text or "none"


def _format_cue(cue: dict[str, Any]) -> str:
    return f"{cue['time']:.2f}s ({cue['intensity']:.2f}, {cue['kind']})"


def analyze_track(
    input_path: Path,
    window_start: float,
    window_duration: float,
    top_cues: int,
    sr: int,
) -> tuple[dict[str, Any], str]:
    y, actual_sr = librosa.load(input_path, sr=sr, mono=True)
    duration = float(librosa.get_duration(y=y, sr=actual_sr))
    window_end = min(duration, window_start + window_duration)

    onset_env = librosa.onset.onset_strength(
        y=y,
        sr=actual_sr,
        hop_length=HOP_LENGTH,
    )
    onset_norm = _normalize(onset_env)

    local_contrast = np.array(
        [_local_contrast(onset_norm, frame, actual_sr) for frame in range(onset_norm.size)]
    )
    contrast_norm = _normalize(local_contrast)

    rms = librosa.feature.rms(
        y=y,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH,
    )[0]
    rms_norm = _normalize(rms)

    spectrum = np.abs(librosa.stft(y, n_fft=BASS_N_FFT, hop_length=HOP_LENGTH))
    frequencies = librosa.fft_frequencies(sr=actual_sr, n_fft=BASS_N_FFT)
    bass_mask = (frequencies >= BASS_MIN_HZ) & (frequencies <= BASS_MAX_HZ)
    if np.any(bass_mask):
        bass = np.mean(spectrum[bass_mask], axis=0)
    else:
        bass = np.zeros(spectrum.shape[1])
    bass_norm = _normalize(bass)

    tempo, beat_frames = librosa.beat.beat_track(
        y=y,
        sr=actual_sr,
        onset_envelope=onset_env,
        hop_length=HOP_LENGTH,
        units="frames",
    )
    beat_frames = np.asarray(beat_frames, dtype=int)
    beat_times = librosa.frames_to_time(beat_frames, sr=actual_sr, hop_length=HOP_LENGTH)

    beats: list[dict[str, Any]] = []
    cue_candidates: list[dict[str, Any]] = []
    for frame, time in zip(beat_frames, beat_times):
        score = _score_frame(frame, onset_norm, contrast_norm, rms_norm, bass_norm)
        beat = {
            "time": _finite_round(float(time)),
            "intensity": _finite_round(score["intensity"]),
            "features": {
                "onsetStrength": _finite_round(score["onsetStrength"]),
                "localOnsetContrast": _finite_round(score["localOnsetContrast"]),
                "rms": _finite_round(score["rms"]),
                "bassEnergy": _finite_round(score["bassEnergy"]),
            },
        }
        beats.append(beat)
        cue_candidates.append({**beat, "kind": "strong_beat"})

    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_env,
        sr=actual_sr,
        hop_length=HOP_LENGTH,
        backtrack=False,
        units="frames",
    )
    for frame in np.asarray(onset_frames, dtype=int):
        time = float(librosa.frames_to_time(frame, sr=actual_sr, hop_length=HOP_LENGTH))
        score = _score_frame(frame, onset_norm, contrast_norm, rms_norm, bass_norm)
        cue_candidates.append(
            {
                "time": _finite_round(time),
                "intensity": _finite_round(score["intensity"]),
                "kind": "onset_peak",
                "features": {
                    "onsetStrength": _finite_round(score["onsetStrength"]),
                    "localOnsetContrast": _finite_round(score["localOnsetContrast"]),
                    "rms": _finite_round(score["rms"]),
                    "bassEnergy": _finite_round(score["bassEnergy"]),
                },
            }
        )

    eligible_cues = [
        cue
        for cue in _dedupe_cues(cue_candidates)
        if cue["intensity"] >= 0.45
    ]
    strongest = sorted(eligible_cues, key=lambda cue: cue["intensity"], reverse=True)[:64]
    strong_cues = sorted(strongest, key=lambda cue: cue["time"])
    # Keep global selections stable, but rank window cues before the global cap.
    window_cues = [
        cue for cue in eligible_cues if window_start <= cue["time"] <= window_end
    ]
    top_window_cues = sorted(window_cues, key=lambda cue: cue["intensity"], reverse=True)[:top_cues]

    data = {
        "schemaVersion": 1,
        "source": {
            "filename": input_path.name,
            "trackStem": input_path.stem,
        },
        "duration": _finite_round(duration, 3),
        "tempo": _finite_round(_as_float(tempo), 2),
        "analysis": {
            "sampleRate": actual_sr,
            "hopLength": HOP_LENGTH,
            "windowStart": _finite_round(window_start, 3),
            "windowDuration": _finite_round(window_duration, 3),
            "windowEnd": _finite_round(window_end, 3),
        },
        "scoring": {
            "intensityFormula": "0.45*onset_strength + 0.25*local_onset_contrast + 0.20*rms + 0.10*bass_energy",
            "features": ["onset_strength", "local_onset_contrast", "rms", "bass_energy"],
            "normalization": "Per-track robust normalization to 0-1 using the 98th percentile, then clamped.",
            "strongCueMinimumIntensity": 0.45,
            "strongCueMaxCount": 64,
        },
        "beats": beats,
        "strongCues": strong_cues,
        "windowStrongCues": top_window_cues,
    }

    window_beats = [
        beat for beat in beats if window_start <= beat["time"] <= window_end
    ]
    reveal_candidates = top_window_cues[: min(5, len(top_window_cues))]

    markdown = "\n".join(
        [
            f"# Music Cues: {input_path.stem}",
            "",
            f"- Track: `{input_path.name}`",
            f"- Duration: {duration:.2f}s",
            f"- Estimated tempo: {_as_float(tempo):.2f} BPM",
            f"- Planning window: {window_start:.2f}-{window_end:.2f}s",
            "",
            "## Useful Beat Grid",
            "",
            _compact_times(window_beats),
            "",
            "## Strong Cues In Window",
            "",
            "\n".join(f"- {_format_cue(cue)}" for cue in top_window_cues) or "- none",
            "",
            "## Reveal Candidates",
            "",
            "\n".join(f"- {_format_cue(cue)}" for cue in reveal_candidates) or "- none",
            "",
            "## Use Policy",
            "",
            "Use these as optional timing hints. Major reveals may move toward a nearby strong cue within about 0.15s; smaller entrances may align to nearby beats within about 0.10s. Ignore cues when they harm story, readability, or pacing.",
            "",
        ]
    )

    return data, markdown


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze a bundled music track and write /brag cue presets."
    )
    parser.add_argument("input", type=Path, help="Input audio file.")
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-md", type=Path, required=True)
    parser.add_argument("--window-start", type=float, default=0.0)
    parser.add_argument("--window-duration", type=float, default=25.0)
    parser.add_argument("--top-cues", type=int, default=10)
    parser.add_argument("--sr", type=int, default=44100)
    args = parser.parse_args()

    data, markdown = analyze_track(
        input_path=args.input,
        window_start=args.window_start,
        window_duration=args.window_duration,
        top_cues=args.top_cues,
        sr=args.sr,
    )

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_md.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    args.output_md.write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    main()

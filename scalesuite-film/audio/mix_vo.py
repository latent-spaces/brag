"""Mix a voiceover over the V2 soundtrack stems.

    python3 audio/mix_vo.py --vo voice.wav|mp3 --stems DIR --out mix.wav [--offset 0.0]
    python3 audio/mix_vo.py --vo l1.wav@0.2 --vo l2.wav@2.5 ... --stems DIR --out mix.wav   (one file per line)
          [--duck-music -9] [--duck-sfx -4] [--lufs -14] [--tp -1.5]

- The voice stays dominant: music is ducked smoothly under speech (lookahead, soft attack/release);
  SFX are ducked less so key picture accents survive but stay below the voice.
- No compression is applied to the voice; only a gentle high-pass for rumble.
- The final mix is loudness-normalised (two-pass ffmpeg loudnorm) with a true-peak ceiling.
The voice file may be one continuous take aligned to 0:00 (use --offset to shift it); see
brag-output/voiceover-timing-v2.md for where each line lands.
"""
import argparse, json, os, subprocess, tempfile, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
ap = argparse.ArgumentParser()
ap.add_argument('--vo', required=True, action='append', help='path or path@start_seconds; repeatable')
ap.add_argument('--stems', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--offset', type=float, default=0.0)
ap.add_argument('--duck-music', type=float, default=-9.0)
ap.add_argument('--duck-sfx', type=float, default=-4.0)
ap.add_argument('--vo-gain', type=float, default=0.0)
ap.add_argument('--lufs', type=float, default=-14.0)
ap.add_argument('--tp', type=float, default=-1.5)
a = ap.parse_args()


def read(path):
    """decode anything ffmpeg reads to 48 kHz stereo float"""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, '<i2').reshape(-1, 2).T.astype(np.float64) / 32768


def write(path, x):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x.T, -1, 1) * 32767).astype('<i2').tobytes())


def stem(name):
    for ext in ('.wav', '.flac'):
        if os.path.exists(os.path.join(a.stems, name + ext)):
            return read(os.path.join(a.stems, name + ext))
    raise SystemExit(f'missing {name}.wav/.flac in {a.stems}')


bed, sfx = stem('bed'), stem('sfx')
n = bed.shape[1]
vo = np.zeros((2, n))
for spec in a.vo:
    path, _, at = spec.rpartition('@') if '@' in spec else (spec, '', '')
    start = (float(at) if at else 0.0) + a.offset
    vo_raw = read(path)
    vo_raw = sosfilt(butter(2, 70, 'high', fs=SR, output='sos'), vo_raw) * 10 ** (a.vo_gain / 20)
    o = int(start * SR)
    seg = vo_raw[:, max(0, -o):max(0, -o) + n - max(0, o)]
    vo[:, max(0, o):max(0, o) + seg.shape[1]] += seg

# voice activity envelope: 20 ms RMS → threshold → lookahead + smoothed attack/release
hop = int(0.02 * SR)
mono = vo.mean(0)
rms = np.sqrt(np.convolve(mono ** 2, np.ones(hop) / hop, 'same'))
active = (rms > 10 ** (-42 / 20)).astype(float)
look = int(0.08 * SR)
active = np.maximum(active, np.concatenate([active[look:], np.zeros(look)]))
env = np.zeros(n)
att, rel = np.exp(-1 / (0.12 * SR)), np.exp(-1 / (0.5 * SR))
# one-pole smoother (vectorised in blocks for speed)
g = 0.0
blk = 256
for i in range(0, n, blk):
    tgt = active[i:i + blk].max()
    c = att if tgt > g else rel
    g = tgt + (g - tgt) * c ** blk
    env[i:i + blk] = g
env = np.convolve(env, np.ones(blk) / blk, 'same')
duck_m = 10 ** (a.duck_music * env / 20)
duck_s = 10 ** (a.duck_sfx * env / 20)
mix = bed * duck_m + sfx * duck_s + vo

tmp = tempfile.mkdtemp()
pre = os.path.join(tmp, 'pre.wav')
write(pre, mix / max(1.0, np.abs(mix).max() / 0.98))
meas = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', pre, '-af',
                       f'loudnorm=I={a.lufs}:TP={a.tp}:LRA=11:print_format=json', '-f', 'null', '-'],
                      capture_output=True, text=True).stderr
j = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af',
                f"loudnorm=I={a.lufs}:TP={a.tp}:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
                f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true",
                '-ar', str(SR), a.out], check=True)
print('wrote', a.out, f'(voice active {100 * (env > 0.5).mean():.0f}% of the film)')

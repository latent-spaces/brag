"""ScaleSuite film soundtrack — synthesised as one piece (music + in-key effects, one shared space).

120 BPM (1 bar = 2 s, the film's scene grid), F major / D minor colour.
Every cue is tied to a picture event in src/scenes/*.js. The film works muted; this stays secondary.

    python3 audio/music.py out.wav [--v1] [--stems DIR]

V2 (default) follows the reading holds in src/timemap.js: one-off cues are remapped to the film
clock; the rhythmic parts are re-laid on the film clock per section so the groove never stutters.
--stems writes bed.wav (music + drums + room) and sfx.wav for the voiceover mix (audio/mix_vo.py).
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

import json, os, re

SR = 48000
ARGS = sys.argv[1:]
V1 = '--v1' in ARGS
STEMS = ARGS[ARGS.index('--stems') + 1] if '--stems' in ARGS else None
_tm = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'timemap.js')).read()
TIMEMAP = json.loads(re.search(r'SS\.TIMEMAP = (\{.*?\n\});', _tm, re.S).group(1))
HOLDS = [] if V1 else [h[:3] for h in TIMEMAP['holds']]


def M(t1):
    """animation (V1) time → film time"""
    out = t1
    for p, s_, w in HOLDS:
        u = (t1 - (p - w / 2)) / w
        out += s_ * (0 if u <= 0 else 1 if u >= 1 else u - np.sin(2 * np.pi * u) / (2 * np.pi))
    return out


def Minv(t2):
    lo, hi = -1.0, t2 + 0.001
    for _ in range(40):
        m = (lo + hi) / 2
        if M(m) < t2:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


DUR = M(TIMEMAP['v1Duration'])
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(3)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)


class Bus:
    def __init__(self):
        self.L = np.zeros(N + SR * 3)
        self.R = np.zeros(N + SR * 3)

    def add(self, sig, t0, gain=1.0, pan=0.0, film=False):
        """t0 is animation (V1) time unless film=True"""
        i = int((t0 if film else M(t0)) * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), len(self.L) - i)
        if n <= 0:
            return
        gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        self.L[i:i + n] += sig[:n] * gain * gl
        self.R[i:i + n] += sig[:n] * gain * gr

    def stereo(self):
        return np.stack([self.L, self.R])


# ---------------------------------------------------------------- instruments
def additive(f, dur, bright, harmonics=18, detune=0.0, phase=None):
    """Band-limited saw-ish tone; `bright` = cutoff in Hz (scalar or per-sample array)."""
    t = t_arr(dur)
    out = np.zeros_like(t)
    ph = rng.random() * 6.283 if phase is None else phase
    for k in range(1, harmonics + 1):
        fk = f * k * (1 + detune)
        if fk > SR * 0.45:
            break
        a = (1.0 / k) * np.exp(-fk / bright)
        out += a * np.sin(2 * np.pi * fk * t + ph * k)
    return out


def env_adsr(n, a, d, s, r, total):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel_start = total - r
    e = np.where(t > rel_start, e * np.clip(1 - (t - rel_start) / max(r, 1e-4), 0, 1), e)
    return e


def pluck(f, dur=0.6, bright=2600, decay=0.22):
    x = additive(f, dur, bright, 14)
    t = t_arr(dur)
    e = np.exp(-t / decay) * np.clip(t / 0.003, 0, 1)
    return x * e


def bell(f, dur=1.6):
    t = t_arr(dur)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)
         + 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.1))
    return x * np.exp(-t / 0.55) * np.clip(t / 0.002, 0, 1)


def pad_chord(notes, dur, bright=1400, att=0.35, rel=0.6, sweep=None):
    n = int(dur * SR)
    out = np.zeros(n)
    b = bright if sweep is None else np.linspace(sweep[0], sweep[1], n)
    for m in notes:
        for dt in (-0.004, 0.0, 0.0045):
            out += additive(midi(m), dur, b, 12, detune=dt)
    return out * env_adsr(n, att, 0.8, 0.85, rel, dur) / (len(notes) * 3)


def kick(level=1.0):
    dur = 0.42
    t = t_arr(dur)
    f = 44 + 70 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.16)
    click = lp(rng.standard_normal(len(t)) * np.exp(-t / 0.004), 3500) * 0.25
    return np.tanh((x + click) * 1.6) * level


def hat(level=1.0, dur=0.07):
    t = t_arr(dur)
    x = hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / 0.018)
    return x * level


def snap(level=1.0):
    t = t_arr(0.2)
    x = bp(rng.standard_normal(len(t)), 1300, 5200) * np.exp(-t / 0.045)
    return x * level


def sub(f, dur, level=1.0):
    t = t_arr(dur)
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
    e = np.clip(t / 0.01, 0, 1) * np.exp(-t / (dur * 0.9))
    return np.tanh(x * 1.3 * e) * level


def whoosh(dur, lo, hi, rise=True, level=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 24
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        k = (b + 0.5) / blocks
        fc = lo * (hi / lo) ** (k if rise else 1 - k)
        out[a:z] = bp(x[a:z], fc * 0.6, fc * 1.6)
    t = np.arange(n) / n
    e = np.sin(np.pi * t) ** 1.5 if not rise else t ** 2.2 * (1 - np.clip((t - 0.93) / 0.07, 0, 1))
    return out * e * level


def impact(level=1.0):
    t = t_arr(1.4)
    f = 38 + 30 * np.exp(-t / 0.12)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5)
    return np.tanh(x * 1.4) * level


# ---------------------------------------------------------------- score
CH = {
    'Dm9': [50, 53, 57, 60, 64], 'Bbmaj9': [46, 50, 53, 57, 60], 'A7sus4': [45, 50, 52, 55, 59],
    'Fmaj9': [41, 45, 48, 52, 55], 'C/E': [40, 43, 48, 52, 55], 'Gm9': [43, 46, 50, 53, 57], 'C6': [48, 52, 55, 57, 60],
}
ROOT = {'Dm9': 38, 'Bbmaj9': 34, 'A7sus4': 33, 'Fmaj9': 29, 'C/E': 28, 'Gm9': 31, 'C6': 36}
PROG = [(0.0, 2.0, 'Dm9'), (2.0, 4.0, 'Bbmaj9'), (4.0, 5.0, 'A7sus4'), (5.0, 7.5, 'Fmaj9'), (7.5, 9.5, 'Fmaj9'),
        (9.5, 11.0, 'C/E'), (11.0, 13.0, 'Dm9'), (13.0, 14.5, 'Bbmaj9'), (14.5, 16.5, 'Gm9'), (16.5, 18.0, 'A7sus4'),
        (18.0, 20.0, 'Bbmaj9'), (20.0, 21.5, 'C6'), (21.5, 23.0, 'Dm9'), (23.0, 24.0, 'Bbmaj9'), (24.0, 27.5, 'Fmaj9')]


def chord_at(t):
    for a, b, c in PROG:
        if a <= t < b:
            return c
    return 'Fmaj9'


def in_any(t, spans):
    return any(a <= t < b for a, b in spans)


music, fx = Bus(), Bus()
drums = Bus()

# pad: wide, soft, darker in S6
for a, b, c in PROG:
    dark = 14.5 <= a < 18.0
    br = 700 if dark else (1900 if a >= 24 else 1400)
    sweep = (900, 3200) if a == 4.0 else None
    x = pad_chord(CH[c] + [CH[c][2] + 12], M(b) - M(a) + 0.6, bright=br, att=0.25 if a else 0.02, rel=0.55, sweep=sweep)
    music.add(x, M(a), 0.55 if a != 5.0 else 0.75, pan=-0.15, film=True)
    music.add(np.roll(x, 240), M(a), 0.45, pan=0.35, film=True)  # Haas-widened copy

# sub bass: 8th pulses in grooves, long notes in calm sections
GROOVE = [(0.0, 5.0), (7.5, 14.5), (18.0, 21.5)]


def grid(a, b, step):
    """(film time, animation time, index) on a grid that restarts at each section's first beat"""
    A, B = M(a), M(b)
    k = 0
    while A + k * step < B - 1e-6:
        yield A + k * step, Minv(A + k * step), k
        k += 1


for a, b in GROOVE:
    for t2, t, k in grid(a, b, 0.5):
        music.add(sub(midi(ROOT[chord_at(t)] + 12), 0.24, 1.0), t2, 0.5 if t < 5 else 0.42, film=True)
for t2, t, k in grid(14.5, 18.0, 1.0):
    music.add(sub(midi(ROOT[chord_at(t)] + 12), 0.5, 1.0), t2, 0.5, film=True)
for t, d, c in [(5.52, 1.9, 'Fmaj9'), (21.5, 1.5, 'Dm9'), (23.0, 1.0, 'Bbmaj9'), (24.72, 2.7, 'Fmaj9')]:
    music.add(sub(midi(ROOT[c] + 12), M(t + d) - M(t), 1.0), t, 0.5)

# drums (film-clock grid per section; kick times kept for the sidechain)
KICKS = []
for a, b in GROOVE:
    for t2, t, k in grid(a, b, BEAT):
        drums.add(kick(), t2, 0.9 if t < 5 else 0.8, film=True)
        KICKS.append(t2)
        if a >= 7.5 and k % 2 == 1:
            drums.add(snap(), t2, 0.16, pan=0.1, film=True)
for t2, t, k in grid(14.5, 18.0, 2 * BEAT):
    drums.add(kick(), t2, 0.75, film=True)
    KICKS.append(t2)
for a, b in [(0.0, 2.5), (7.5, 14.5), (18.0, 21.5)]:
    for t2, t, k in grid(a, b, BEAT):
        drums.add(hat(), t2 + 0.25, 0.14, pan=0.3, film=True)
for t2, t, k in grid(2.5, 5.0, 0.125):
    if k % 2 == 1:
        drums.add(hat(dur=0.05), t2, 0.07 + 0.08 * (t - 2.5) / 2.5, pan=0.3 if k % 4 == 1 else -0.2, film=True)
for t in (24.0, 24.72):
    drums.add(kick(), t, 0.8)

# pluck arpeggio (16ths in tension, 8ths elsewhere), brighter as the problem grows
arp_spans = [(0.0, 5.0, 0.125), (7.5, 14.5, 0.25), (14.5, 18.0, 0.25), (18.0, 21.5, 0.125)]
for a, b, step in arp_spans:
    for t2, t, k in grid(a, b, step):
        c = CH[chord_at(t)]
        tones = sorted({n + 12 for n in c[1:]} | {n + 24 for n in c[1:3]})
        n = tones[(k * 3 + (k // 4)) % len(tones)]
        br = 1600 + (2600 * (t - 2.5) / 2.5 if 2.5 <= t < 5 else 1400)
        if 14.5 <= t < 18:
            br = 900
        lvl = 0.16 if step == 0.125 else 0.2
        music.add(pluck(midi(n), 0.5, br, 0.16), t2, lvl * (0.8 if k % 2 else 1.0), pan=0.35 if k % 2 else -0.35, film=True)

# ---------------------------------------------------------------- picture-synced effects (all in key)
# S1 card pops: the counter climbing, D minor pentatonic
pent = [74, 77, 79, 81, 84, 86, 89, 91, 93]
for i in range(1, 10):
    fx.add(pluck(midi(pent[i - 1]), 0.45, 5000, 0.09), 0.05 + i * 0.094, 0.13, pan=-0.4 + 0.08 * i)
# S1 chips spawn: one soft shimmer
fx.add(bell(midi(81)) * 0.5 + bell(midi(88)) * 0.3, 1.1, 0.07, pan=0.2)
# S2 tension riser into the collapse
fx.add(whoosh(M(5.0) - M(3.5), 400, 5000, rise=True), 3.5, 0.22)
# S3 collapse: reverse suck, then the logo bloom
fx.add(whoosh(M(5.5) - M(5.0), 3000, 300, rise=True), 5.0, 0.3)
fx.add(impact(), 5.5, 0.55)
for m, d in ((77, 0.0), (84, 0.06), (88, 0.12)):
    fx.add(bell(midi(m), 2.4), 5.55 + d, 0.12)
# S4 pulses flowing into the hub
for i in range(5):
    fx.add(pluck(midi([72, 76, 79, 81, 84][i]), 0.4, 4000, 0.08), 10.32 + i * 0.07, 0.1, pan=-0.4 + 0.2 * i)
# S5 duplicates fly out
fx.add(whoosh(0.45, 600, 3500, rise=False), 11.84, 0.14, pan=-0.2)
fx.add(whoosh(0.45, 700, 4000, rise=False), 11.98, 0.1, pan=0.3)
# S6 iris into the dark stage, check marks (bells), contraction
fx.add(whoosh(0.7, 2500, 250, rise=False), 14.45, 0.2)
for t, m in zip((15.35, 16.21, 16.99, 17.27), (81, 84, 88, 89)):
    fx.add(bell(midi(m), 1.2), t, 0.09, pan=0.15)
fx.add(whoosh(0.45, 300, 3000, rise=True), 17.86, 0.16)
# S7 tap, the lead's glide, stations, arrival chime
fx.add(pluck(midi(69), 0.3, 1800, 0.05), 19.34, 0.2)
t = t_arr(1.4)
glide_f = midi(72) * 2 ** ((np.clip((t - 0.0) / 1.38, 0, 1)) * 12 / 12)
glide = np.sin(2 * np.pi * np.cumsum(glide_f) / SR) * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 2
fx.add(lp(glide, 2500), 19.46, 0.05)
fx.add(pluck(midi(77), 0.4, 4500, 0.1), 19.86, 0.12)
fx.add(pluck(midi(81), 0.4, 4500, 0.1), 20.40, 0.13)
fx.add(bell(midi(84), 1.8) + bell(midi(89), 1.8) * 0.7, 20.86, 0.13)
# S8 the lead dot flies to centre; "Pas" lands
fx.add(whoosh(0.35, 900, 5000, rise=False), 21.28, 0.1)
fx.add(sub(midi(38), 0.5, 1.0), 22.56, 0.25)
# S9 nodes align, converge, the mark lands; CTA
fx.add(whoosh(M(24.75) - M(23.95), 500, 6000, rise=True), 23.95, 0.14)
for m, d in ((65, 0.0), (72, 0.03), (77, 0.06), (81, 0.09), (84, 0.12)):
    fx.add(bell(midi(m + 12), 2.8), 24.74 + d, 0.07)
fx.add(pluck(midi(84), 0.5, 5000, 0.12), 25.2, 0.1)

# ---------------------------------------------------------------- mix
mus = music.stereo()
dr = drums.stereo()
fxs = fx.stereo()
nn = mus.shape[1]
tt = np.arange(nn) / SR

# sidechain pump on music from the kick grid (subtle)
duck = np.ones(nn)
for t0 in KICKS:
    if True:
        a = int(t0 * SR)
        seg = np.arange(int(0.35 * SR)) / SR
        duck[a:a + len(seg)] = np.minimum(duck[a:a + len(seg)], 1 - 0.28 * np.exp(-seg / 0.09))
mus *= duck

# S6 dark: low-pass the music bus (block-wise cutoff automation), S2 filter opening handled in voices
def auto_lp(x, cutoff_fn, block=1024):
    y = np.zeros_like(x)
    for ch in range(x.shape[0]):
        zi = None
        for a in range(0, x.shape[1], block):
            fc = cutoff_fn(Minv((a + block / 2) / SR))
            sos = butter(2, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
            if zi is None:
                zi = np.zeros((sos.shape[0], 2))
            y[ch, a:a + block], zi = sosfilt(sos, x[ch, a:a + block], zi=zi)
    return y


def cut(t):
    if 14.4 <= t < 18.0:
        return 1400 + 3000 * max(0, (t - 16.8) / 1.2) ** 2
    if 5.0 <= t < 5.5:
        return 18000 - 15000 * (t - 5.0) / 0.5
    return 18000


mus = auto_lp(mus, cut)
dr = auto_lp(dr, cut)

# shared space: synthetic stereo room (music + fx share it; drums get a little)
ir_n = int(2.3 * SR)
irt = np.arange(ir_n) / SR
ir = np.stack([lp(rng.standard_normal(ir_n), 5500) * np.exp(-irt / 0.42) for _ in range(2)])
ir[:, :int(0.018 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
send = mus * 0.35 + fxs * 0.6 + dr * 0.06
wet = np.stack([fftconvolve(send[c], ir[c])[:nn] for c in range(2)]) * 0.55

# dotted-8th delay on the effects only
dly = np.zeros_like(fxs)
for k, g in ((1, 0.32), (2, 0.14)):
    s = int(0.375 * k * SR)
    dly[:, s:] += lp(fxs[:, :-s], 3500) * g
dly[[0, 1]] = dly[[1, 0]]  # ping-pong

bed = hp(mus * 1.05 + dr * 0.68 + wet, 28)
sfx = hp(fxs * 0.8 + dly * 0.5, 28)
mix = bed + sfx
# master: gentle glue + soft clip, end fade on the CTA hold
end = int(DUR * SR)
mix = mix[:, :end]
fade = np.ones(end)
fs0 = int((DUR - 1.1) * SR)
fade[fs0:] = np.linspace(1, 0, end - fs0) ** 1.6
fade[:int(0.004 * SR)] = np.linspace(0, 1, int(0.004 * SR))
mix *= fade
norm = np.max(np.abs(mix)) + 1e-9
mix /= norm
mix = np.tanh(mix * 1.25) / np.tanh(1.25) * 0.9

import wave


def write(path, x):
    pcm = (np.clip(x.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


out = next((a for a in ARGS if a.endswith('.wav')), 'music.wav')
write(out, mix)
if STEMS:  # linear stems (same gain staging, no master clip) for the voiceover mix
    os.makedirs(STEMS, exist_ok=True)
    g = 0.9 / norm
    write(os.path.join(STEMS, 'bed.wav'), bed[:, :end] * fade * g)
    write(os.path.join(STEMS, 'sfx.wav'), sfx[:, :end] * fade * g)
print('wrote', out, f'{end / SR:.2f}s', 'V1' if V1 else 'V2')

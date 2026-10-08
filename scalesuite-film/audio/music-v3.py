"""ScaleSuite film V3 soundtrack: synthesised as one piece, new score (the V2 music is not reused).

120 BPM (1 beat = 0.5 s, scene boundaries on beats). D minor colour for the problem, F major for the
relief. Every effect is placed on a picture cue exported from the GSAP timeline
(render/cues-v3.mjs), so picture and sound cannot drift apart.

    node render/cues-v3.mjs > cues.json
    python3 audio/music-v3.py --cues cues.json [--end 8.5] out.wav

Arc: hook (light pulse, one pluck per card, the count climbs) → smash → chaos (pulse thickens,
notification blips pile up and cluster, stab + whoosh on every headline swap, riser) → everything
is sucked into the node → impact, then near silence → the relief: a warm F major bloom, a bell on
the mark, the letters as a soft arpeggio → a pickup into the dashboard groove.
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
ARGS = sys.argv[1:]
CUES = json.load(open(ARGS[ARGS.index('--cues') + 1]))
END = float(ARGS[ARGS.index('--end') + 1]) if '--end' in ARGS else CUES['duration']
OUT = next((a for a in ARGS if a.endswith('.wav')), 'music-v3.wav')
N = int(SR * (END + 3))
rng = np.random.default_rng(31)


def cue(kind):
    return [c for c in CUES['cues'] if c['type'] == kind]


def at(kind, i=0):
    c = cue(kind)
    return c[i]['t'] if len(c) > i else None


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
        self.x = np.zeros((2, N))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        i = int(round(t0 * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), N - i)
        if n <= 0:
            return
        gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        self.x[0, i:i + n] += sig[:n] * gain * gl
        self.x[1, i:i + n] += sig[:n] * gain * gr


# ---------------------------------------------------------------- instruments
def additive(f, dur, bright, harmonics=16, detune=0.0):
    t = t_arr(dur)
    out = np.zeros_like(t)
    ph = rng.random() * 6.283
    for k in range(1, harmonics + 1):
        fk = f * k * (1 + detune)
        if fk > SR * 0.45:
            break
        out += (1.0 / k) * np.exp(-fk / bright) * np.sin(2 * np.pi * fk * t + ph * k)
    return out


def adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    total = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    return e * np.clip((total - t) / max(r, 1e-4), 0, 1)


def pluck(f, dur=0.5, bright=3000, decay=0.18):
    t = t_arr(dur)
    return additive(f, dur, bright, 12) * np.exp(-t / decay) * np.clip(t / 0.003, 0, 1)


def felt(f, dur=1.6):
    """soft felt-piano: few harmonics, quick bloom, long decay"""
    t = t_arr(dur)
    x = additive(f, dur, 1100, 8) + 0.25 * np.sin(2 * np.pi * f * 2.001 * t) * np.exp(-t / 0.3)
    return x * np.exp(-t / 0.7) * np.clip(t / 0.006, 0, 1)


def bell(f, dur=1.8):
    t = t_arr(dur)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)
         + 0.16 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.1))
    return x * np.exp(-t / 0.6) * np.clip(t / 0.002, 0, 1)


def blip(f, level=1.0):
    """two-tone notification blip"""
    t = t_arr(0.16)
    f2 = np.where(t < 0.055, f, f * 1.335)
    x = np.sin(2 * np.pi * np.cumsum(f2) / SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f2) / SR)
    return x * np.exp(-t / 0.05) * np.clip(t / 0.002, 0, 1) * level


def pad(notes, dur, bright=1400, att=0.5, rel=0.8):
    n = int(dur * SR)
    out = np.zeros(n)
    for m in notes:
        for dt in (-0.004, 0.0, 0.0045):
            out += additive(midi(m), dur, bright, 10, detune=dt)
    return out * adsr(n, att, 1.0, 0.85, rel) / (len(notes) * 3)


def stab(notes, dur=0.5, bright=2600):
    n = int(dur * SR)
    out = np.zeros(n)
    for m in notes:
        for dt in (-0.008, 0.0, 0.009):
            out += additive(midi(m), dur, bright, 14, detune=dt)
    t = np.arange(n) / SR
    return out * np.exp(-t / 0.16) * np.clip(t / 0.004, 0, 1) / (len(notes) * 3)


def kick(level=1.0, tight=False):
    dur = 0.4
    t = t_arr(dur)
    f = 46 + 80 * np.exp(-t / (0.025 if tight else 0.035))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.12 if tight else 0.17))
    click = lp(rng.standard_normal(len(t)) * np.exp(-t / 0.004), 4000) * 0.25
    return np.tanh((x + click) * 1.6) * level


def hat(level=1.0, dur=0.06):
    t = t_arr(dur)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / 0.016) * level


def tick(level=1.0):
    t = t_arr(0.03)
    return bp(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t / 0.006) * level


def sub(f, dur, level=1.0, att=0.01):
    t = t_arr(dur)
    x = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)
    return np.tanh(x * 1.3 * np.clip(t / att, 0, 1) * np.exp(-t / (dur * 0.8))) * level


def whoosh(dur, lo, hi, shape='swell', level=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 32
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        k = (b + 0.5) / blocks
        fc = lo * (hi / lo) ** k
        out[a:z] = bp(x[a:z], fc * 0.6, fc * 1.7)
    u = np.arange(n) / n
    e = {'swell': np.sin(np.pi * u) ** 1.4, 'rise': u ** 2.4 * (1 - np.clip((u - 0.96) / 0.04, 0, 1)),
         'fall': (1 - u) ** 1.6 * np.clip(u / 0.02, 0, 1)}[shape]
    return out * e * level


def boom(level=1.0, dur=2.0, decay=0.7):
    t = t_arr(dur)
    f = 34 + 40 * np.exp(-t / 0.09)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    body = lp(rng.standard_normal(len(t)), 180) * np.exp(-t / 0.25) * 0.5
    return np.tanh((x + body) * 1.5) * level


# ---------------------------------------------------------------- score
music, fx, drums = Bus(), Bus(), Bus()
DM = [50, 53, 57, 60, 64]          # Dm9
BB = [46, 50, 53, 57, 60]          # Bbmaj9
FMAJ = [41, 48, 52, 55, 57, 60, 64]  # Fmaj9 (open)
smash, plus = at('smash'), at('line', 1)
ant, implode, impact = at('anticipation'), at('implode'), at('impact')
bloom, mark, letters, tag, dock, header = at('bloom'), at('mark'), at('letters'), at('tagline'), at('dock'), at('header')

# ---- hook (0 → smash): light pulse, pad, one pluck per card climbing with the count
music.add(pad(DM, smash + 0.4, bright=1300, att=0.05, rel=0.35), 0.0, 0.42, pan=-0.2)
for b in np.arange(0.0, smash, 0.5):
    drums.add(kick(0.75, tight=True), b, 0.7)
    drums.add(hat(0.9), b + 0.25, 0.11, pan=0.3)
    music.add(sub(midi(38), 0.24), b, 0.32)
pent = [62, 65, 67, 69, 72, 74, 77, 79, 81]
for c in cue('pop'):
    i = c['i']
    fx.add(pluck(midi(pent[i - 1] + 12), 0.5, 5200, 0.1), c['t'], 0.16, pan=-0.45 + 0.1 * i)
for k in range(10):  # chip wave: tiny in-key ticks
    fx.add(pluck(midi([74, 77, 81, 84, 86][k % 5] + 12), 0.25, 7000, 0.04), at('chips') + 0.06 + k * 0.035, 0.07, pan=-0.5 + 0.1 * k)
fx.add(sub(midi(38), 0.6, 1.0), at('line'), 0.3)

# ---- smash zoom: reverse rush into a hit
fx.add(whoosh(0.36, 400, 7000, 'rise'), smash - 0.06, 0.32)
drums.add(kick(1.0), smash + 0.3, 0.95)
fx.add(boom(0.6, 0.9), smash + 0.3, 0.35)
fx.add(hp(rng.standard_normal(int(0.5 * SR)), 3000) * np.exp(-t_arr(0.5) / 0.12), smash + 0.3, 0.16)

# ---- chaos: four-on-the-floor, hats thicken (8ths → 16ths → 32nds), pulsing bass with a b2 rub
ch0 = smash + 0.3
for b in np.arange(ch0 + 0.5, ant, 0.5):
    drums.add(kick(0.95, tight=True), b, 0.85)
for b in np.arange(ch0, ant, 0.0625):
    u = (b - ch0) / (ant - ch0)
    step = 0.25 if u < 0.3 else 0.125 if u < 0.7 else 0.0625
    if abs((b - ch0) / step - round((b - ch0) / step)) < 1e-6:
        drums.add(hat(0.9, 0.05), b, 0.06 + 0.1 * u, pan=0.3 if int(b / 0.0625) % 2 else -0.25)
for b in np.arange(ch0, ant, 0.25):
    u = (b - ch0) / (ant - ch0)
    note = 38 if int((b - ch0) / 0.25) % 4 != 3 or u < 0.4 else 39  # D, rubbing Eb as tension grows
    music.add(sub(midi(note + 12), 0.2), b, 0.38)
    music.add(pluck(midi(note + 24), 0.22, 900 + 2200 * u, 0.06), b, 0.12, pan=0.2)
music.add(pad(BB + [64], ant - ch0 + 0.2, bright=900, att=0.6, rel=0.2), ch0, 0.32, pan=0.25)
# notification blips: one per task, clustered pitches, louder as the pile grows
cluster = [74, 75, 77, 79, 80, 82]
for c in cue('task'):
    u = (c['t'] - ch0) / (ant - ch0)
    fx.add(blip(midi(cluster[(c['i'] * 5) % len(cluster)] + 12), 1.0), c['t'], 0.05 + 0.07 * u,
           pan=float(np.sin(c['i'] * 2.4)) * 0.7)
# headline swaps: detuned minor stab + whip whoosh on the camera jolt
for c in cue('swap'):
    root = [50, 52][c['k'] - 1]
    fx.add(stab([root, root + 3, root + 6, root + 10], 0.6), c['t'], 0.34)
    fx.add(whoosh(0.3, 900, 5000, 'swell'), c['t'] - 0.06, 0.18)
fx.add(stab([50, 53, 56, 60], 0.6), plus, 0.2)
# riser: rising noise + rising drone to the anticipation
fx.add(whoosh(ant - 3.3, 300, 9000, 'rise'), 3.3, 0.3)
t = t_arr(ant - ch0)
drone_f = midi(50) * 2 ** (np.clip(t / (ant - ch0), 0, 1) ** 2 * 7 / 12)
drone = np.sin(2 * np.pi * np.cumsum(drone_f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(drone_f * 1.5) / SR)
music.add(lp(drone, 1800) * np.clip(t / 0.8, 0, 1) * (0.3 + 0.7 * (t / (ant - ch0)) ** 2), ch0, 0.09)

# ---- implosion: everything cuts; a reversed suck into the node, then the impact and near silence
suck = whoosh(impact - ant, 7000, 250, 'rise')
fx.add(suck, ant, 0.42)
t = t_arr(impact - ant)
down_f = midi(74) * 2 ** (-(t / (impact - ant)) ** 1.5 * 24 / 12)
fx.add(np.sin(2 * np.pi * np.cumsum(down_f) / SR) * (t / (impact - ant)) ** 1.2, ant, 0.08)
fx.add(boom(1.0, 1.4, 0.32), impact, 0.5)
fx.add(bell(midi(77), 2.6) * 0.6, impact + 0.01, 0.05)
fx.add(sub(midi(41), 0.5, 1.0, att=0.06), at('breath'), 0.18)  # node breath: one soft heartbeat

# ---- relief: F major bloom, bell chord on the mark, letters as a soft arpeggio, felt piano
rel_end = END + 2
music.add(pad(FMAJ, rel_end - bloom, bright=1900, att=0.9, rel=1.0), bloom, 0.46, pan=-0.15)
music.add(np.roll(pad(FMAJ + [72], rel_end - bloom, bright=2600, att=1.2, rel=1.0), 300), bloom, 0.24, pan=0.4)
music.add(sub(midi(29 + 12), rel_end - bloom, 1.0, att=0.6), bloom, 0.2)
fx.add(whoosh(0.9, 200, 2600, 'swell'), bloom, 0.12)
for m, d in ((65, 0.0), (69, 0.05), (72, 0.1), (76, 0.15)):
    fx.add(bell(midi(m + 12), 2.6), mark + 0.18 + d, 0.07)
for k, m in enumerate([72, 74, 76, 77, 79, 81, 84, 86, 88, 89]):
    fx.add(pluck(midi(m), 0.6, 4200, 0.16), letters + k * 0.032, 0.05, pan=-0.45 + 0.1 * k)
for m in (53, 57, 60, 64):
    music.add(felt(midi(m), 2.4), tag, 0.2)
for k, m in enumerate([84, 88, 91, 96]):
    fx.add(bell(midi(m), 1.2), at('sheen') + 0.28 + k * 0.06, 0.025)
# dock + header: soft downward whoosh, a click as the card lands, a pickup into the next scene
fx.add(whoosh(0.45, 2500, 500, 'swell'), dock, 0.1)
fx.add(tick(1.0), header + 0.08, 0.35)
fx.add(pluck(midi(81), 0.4, 5000, 0.08), header + 0.08, 0.07)
for k, b in enumerate(np.arange(8.0, END + 0.01, 0.125)):
    drums.add(hat(0.8, 0.04), b, 0.02 + 0.03 * k, pan=0.25)

# ---------------------------------------------------------------- mix
mus, dr, fxs = music.x, drums.x, fx.x
# chaos sidechain pump on the music from the kick grid
duck = np.ones(N)
for b in np.arange(ch0 + 0.5, ant, 0.5):
    a = int(b * SR)
    seg = np.arange(int(0.3 * SR)) / SR
    duck[a:a + len(seg)] = np.minimum(duck[a:a + len(seg)], 1 - 0.3 * np.exp(-seg / 0.08))
mus = mus * duck
# hard cut of music + drums from the anticipation to the bloom (the silence is the relief)
gate = np.ones(N)
a0, a1, b0 = int(ant * SR), int((ant + 0.03) * SR), int(bloom * SR)
gate[a0:a1] = np.linspace(1, 0, a1 - a0)
gate[a1:b0] = 0
mus, dr = mus * gate, dr * gate
# shared room
ir_n = int(2.4 * SR)
irt = np.arange(ir_n) / SR
ir = np.stack([lp(rng.standard_normal(ir_n), 5000) * np.exp(-irt / 0.45) for _ in range(2)])
ir[:, :int(0.018 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
send = mus * 0.3 + fxs * 0.55 + dr * 0.05
wet = np.stack([fftconvolve(send[c], ir[c])[:N] for c in range(2)]) * 0.5
mix = hp(mus + dr * 0.75 + fxs * 0.85 + wet, 28)
end = int(END * SR)
mix = mix[:, :end]
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2) * 0.9

pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', OUT, f'{END:.2f}s')

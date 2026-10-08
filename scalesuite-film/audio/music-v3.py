"""ScaleSuite film V3 soundtrack: one synthesised piece built around a 4-note signature.

The signature (C5 F5 E5 A5: up a 4th, down a half step, up a 4th) is the brand's sonic logo.
- Chaos: the signature is shattered. Its notes, in D harmonic minor and detuned, come back as
  notification pings, over keyboard clicks, phone buzzes and a ticking clock that speeds up. No
  four-on-the-floor.
- Relief: after the silence, the signature is played clean on kalimba, once: the same notes,
  now in order.
- Product: a swung neo-soul groove (FM electric piano, marimba, round bass, rim, shaker, soft
  kick). Every row that docks, every field that fills and every counter that rolls has its own
  in-key sound.
- Lead: the groove builds while the token travels, an 80 ms freeze on Courtier 03, then the drop.
  The notification chime is the signature.
- End: the signature resolves on F major under the logo.
Every effect sits on a picture cue exported from the GSAP timeline (render/cues-v3.mjs).

    python3 audio/music-v3.py --cues cues.json [--end 31] out.wav [--stems DIR]
"""
import json
import os
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
ARGS = sys.argv[1:]
CUES = json.load(open(ARGS[ARGS.index('--cues') + 1]))
END = float(ARGS[ARGS.index('--end') + 1]) if '--end' in ARGS else CUES['duration']
OUT = next((a for a in ARGS if a.endswith('.wav')), 'music-v3.wav')
STEMS = ARGS[ARGS.index('--stems') + 1] if '--stems' in ARGS else None
N = int(SR * (END + 3))
rng = np.random.default_rng(31)
BEAT, SWING = 0.5, 0.58


def cue(kind):
    return [c for c in CUES['cues'] if c['type'] == kind]


def at(kind, i=0, default=None):
    c = cue(kind)
    return c[i]['t'] if len(c) > i else default


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
        if t0 is None or t0 >= END + 2:
            return
        i = int(round(t0 * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), N - i)
        if n <= 0:
            return
        gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        self.x[0, i:i + n] += sig[:n] * gain * gl
        self.x[1, i:i + n] += sig[:n] * gain * gr


def env(t, a, d):
    return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-t / d)


# ---------------------------------------------------------------- instruments
def kalimba(f, dur=1.8, bright=1.0):
    t = t_arr(dur)
    x = (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.9)
         + 0.32 * bright * np.sin(2 * np.pi * f * 5.95 * t) * env(t, 0.001, 0.12)
         + 0.1 * bright * np.sin(2 * np.pi * f * 13.4 * t) * env(t, 0.001, 0.04))
    thumb = lp(rng.standard_normal(len(t)), 2500) * env(t, 0.0005, 0.006) * 0.25
    return x + thumb


def marimba(f, dur=0.9):
    t = t_arr(dur)
    x = (np.sin(2 * np.pi * f * t) * env(t, 0.001, 0.42) + 0.24 * np.sin(2 * np.pi * f * 3.93 * t) * env(t, 0.001, 0.07)
         + 0.05 * np.sin(2 * np.pi * f * 9.76 * t) * env(t, 0.001, 0.025))
    return x + bp(rng.standard_normal(len(t)), 800, 4000) * env(t, 0.0005, 0.004) * 0.15


def epiano(f, dur=1.8, vel=1.0):
    """FM tine piano: index decays, a short metallic tine on the attack, gentle tremolo"""
    t = t_arr(dur)
    idx = (1.8 * vel) * np.exp(-t / 0.22) + 0.35
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    x += 0.12 * vel * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.018)
    trem = 1 + 0.07 * np.sin(2 * np.pi * 5.2 * t)
    return x * env(t, 0.003, 1.3) * trem


def chord(fn, notes, dur, **kw):
    return sum(fn(midi(n), dur, **kw) for n in notes) / len(notes)


def choir(notes, dur, att=0.8, rel=1.0, bright=1.0):
    """'aah' pad: detuned saws through two vowel formants, slow vibrato"""
    t = t_arr(dur)
    out = np.zeros(len(t))
    for n in notes:
        for dt in (-0.006, 0.0, 0.006):
            f = midi(n) * (1 + dt) * (1 + 0.003 * np.sin(2 * np.pi * (4.6 + dt * 100) * t))
            ph = 2 * np.pi * np.cumsum(f) / SR
            out += sum(np.sin(k * ph) / k for k in range(1, 9))
    out = bp(out, 550, 900) * 1.0 + bp(out, 1050, 1500 * bright) * 0.6
    e = np.clip(t / att, 0, 1) * np.clip((dur - t) / rel, 0, 1)
    return out * e / (len(notes) * 3)


def bass(f, dur=0.45, vel=1.0):
    t = t_arr(dur)
    slide = f * (1 - 0.06 * np.exp(-t / 0.03))  # tiny slide up into the note
    ph = 2 * np.pi * np.cumsum(slide) / SR
    x = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    return np.tanh(1.4 * x * env(t, 0.004, dur * 0.55)) * vel


def kick(vel=1.0):
    t = t_arr(0.32)
    f = 48 + 60 * np.exp(-t / 0.03)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)) * vel


def rim(vel=1.0):
    t = t_arr(0.06)
    return (bp(rng.standard_normal(len(t)), 1800, 6000) * 0.6 + np.sin(2 * np.pi * 1700 * t) * 0.5) * env(t, 0.0005, 0.012) * vel


def shaker(vel=1.0):
    t = t_arr(0.07)
    return hp(rng.standard_normal(len(t)), 6000) * np.clip(t / 0.008, 0, 1) * np.exp(-t / 0.028) * vel


def clap(vel=1.0):
    t = t_arr(0.25)
    x = np.zeros(len(t))
    for k, off in enumerate((0.0, 0.009, 0.017)):
        i = int(off * SR)
        n = len(t) - i
        x[i:] += bp(rng.standard_normal(n), 900, 4200) * np.exp(-np.arange(n) / SR / (0.006 if k < 2 else 0.08))
    return x * vel


def tick(vel=1.0):  # woodblock-ish clock tick
    t = t_arr(0.05)
    return (np.sin(2 * np.pi * 2300 * t) + 0.5 * np.sin(2 * np.pi * 3700 * t)) * env(t, 0.0004, 0.008) * vel


def key(vel=1.0):  # keyboard click
    t = t_arr(0.04)
    v = 0.8 + 0.4 * rng.random()
    return (bp(rng.standard_normal(len(t)), 2000, 7000) * env(t, 0.0003, 0.004) * v + np.sin(2 * np.pi * 160 * t) * env(t, 0.001, 0.008) * 0.4) * vel


def ping(f, vel=1.0, detune=0.0):  # notification ping
    t = t_arr(0.35)
    f = f * 2 ** (detune / 1200)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t / 0.05)) * env(t, 0.001, 0.09) * vel


def buzz(dur=0.32, vel=1.0):  # phone vibration
    t = t_arr(dur)
    x = np.tanh(3 * np.sin(2 * np.pi * 172 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return lp(x, 900) * np.clip(t / 0.02, 0, 1) * np.clip((dur - t) / 0.04, 0, 1) * vel


def paper(vel=1.0):  # a card dropped on the pile
    t = t_arr(0.12)
    return (lp(rng.standard_normal(len(t)), 2600) * env(t, 0.001, 0.02) + np.sin(2 * np.pi * 95 * t) * env(t, 0.001, 0.03) * 0.6) * vel


def thump(vel=1.0, f0=60, dur=0.7):
    t = t_arr(dur)
    f = f0 + 50 * np.exp(-t / 0.05)
    return np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.35))) * vel


def whoosh(dur, lo, hi, shape='swell', vel=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for b in range(32):
        a, z = b * n // 32, (b + 1) * n // 32
        fc = lo * (hi / lo) ** ((b + 0.5) / 32)
        out[a:z] = bp(x[a:z], fc * 0.6, fc * 1.7)
    u = np.arange(n) / n
    e = {'swell': np.sin(np.pi * u) ** 1.4, 'rise': u ** 2.4 * (1 - np.clip((u - 0.96) / 0.04, 0, 1)), 'fall': (1 - u) ** 1.6 * np.clip(u / 0.03, 0, 1)}[shape]
    return out * e * vel


def bell_k(f, dur=2.4):
    t = t_arr(dur)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.3) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.1)) * env(t, 0.002, 0.8)


# ---------------------------------------------------------------- the signature
SIG = [72, 77, 76, 81]           # C5 F5 E5 A5 (F major)
SIG_MINOR = [69, 74, 73, 77]     # A4 D5 C#5 F5 (D harmonic minor: the same shape, tense)


def signature(t0, bus, step=0.16, oct=0, vel=1.0, inst='kalimba', pan=0.0):
    for k, n in enumerate(SIG):
        f = midi(n + 12 * oct)
        s = kalimba(f, 2.4) if inst == 'kalimba' else (bell_k(f) if inst == 'bell' else marimba(f, 1.0))
        bus.add(s, t0 + k * step, vel, pan=pan - 0.15 + 0.1 * k)


# ---------------------------------------------------------------- cue times
smash, plus_l = at('smash'), at('line', 1)
ant, implode, impact, breath = at('anticipation'), at('implode'), at('impact'), at('breath')
bloom, mark, letters, tag, dock, header = at('bloom'), at('mark'), at('letters'), at('tagline'), at('dock'), at('header')
G0 = 8.5                              # the groove starts with the dashboard
LEAD0 = 18.0
lock, notify = at('lock', 0, 21.85), at('notify', 0, 22.5)
line8, mark2 = at('line8', 0, 24.55), at('mark2', 0, 27.7)
music, fx, drums = Bus(), Bus(), Bus()

# harmony (one chord per bar = 2 s in the groove sections)
CH = {'Fmaj9': [53, 57, 60, 64, 67], 'Am7': [57, 60, 64, 67], 'Bbmaj9': [58, 62, 65, 69, 72], 'C69': [60, 64, 67, 69, 74],
      'Dm9': [50, 53, 57, 60, 64], 'Gm9': [55, 58, 62, 65, 69], 'C7sus': [48, 55, 58, 60, 65]}
ROOT = {'Fmaj9': 41, 'Am7': 45, 'Bbmaj9': 46, 'C69': 48, 'Dm9': 38, 'Gm9': 43, 'C7sus': 36}
PROG = [(8.5, 'Fmaj9'), (10.5, 'Am7'), (12.5, 'Bbmaj9'), (14.5, 'C69'), (16.5, 'Bbmaj9'),
        (18.0, 'Dm9'), (19.0, 'Bbmaj9'), (20.0, 'Gm9'), (21.0, 'C7sus'),
        (notify, 'Fmaj9'), (notify + 1.0, 'Bbmaj9'), (notify + 2.0, 'Fmaj9'),
        (line8, 'Bbmaj9'), (line8 + 1.25, 'C69'), (mark2, 'Fmaj9')]


def chord_at(t):
    c = PROG[0][1]
    for a, name in PROG:
        if t >= a:
            c = name
    return c


def swung(b0, b1, step=0.125):
    """16th-note grid with swing (odd 16ths late)"""
    k, out = 0, []
    while b0 + k * step < b1 - 1e-6:
        out.append((b0 + k * step + (step * (2 * SWING - 1) if k % 2 else 0), k))
        k += 1
    return out


# ================================================================ HOOK (0 → smash)
for b in np.arange(0.0, smash, BEAT):
    k = int(round(b / BEAT))
    if k % 2 == 0:
        drums.add(kick(0.8), b, 0.75)
    else:
        drums.add(rim(1.0), b, 0.35, pan=0.15)
    music.add(bass(midi(38 + 12), 0.4), b, 0.3)
for t, k in swung(0.0, smash):
    drums.add(shaker(), t, 0.05 + 0.03 * (k % 2 == 0), pan=0.35)
for c in cue('pop'):  # the count climbs: marimba up the minor shape
    scale = [62, 64, 65, 69, 72, 74, 76, 77, 81]
    fx.add(marimba(midi(scale[c['i'] - 1])), c['t'], 0.26, pan=-0.4 + 0.09 * c['i'])
for k in range(10):  # chip wave: the signature flickers once, fast and quiet
    fx.add(kalimba(midi(SIG[k % 4] + 12), 0.6, 0.6), at('chips') + 0.06 + k * 0.035, 0.06, pan=-0.45 + 0.1 * k)
music.add(chord(epiano, CH['Dm9'], 1.6, vel=0.7), at('line'), 0.32, pan=-0.1)

# ================================================================ SMASH → CHAOS
fx.add(whoosh(0.34, 300, 6000, 'rise'), smash - 0.04, 0.3)
fx.add(thump(0.9, 55, 0.5), smash + 0.3, 0.6)
fx.add(paper(1.0), smash + 0.3, 0.5)
ch0 = smash + 0.3
span = ant - ch0
t = ch0  # ticking clock: 8ths speeding to 16ths, then 32nds
while t < ant - 0.02:
    u = (t - ch0) / span
    drums.add(tick(1.0), t, 0.22 + 0.16 * u, pan=0.45)
    t += 0.25 if u < 0.35 else 0.125 if u < 0.75 else 0.0625
t = ch0 + 0.1  # keyboard typing: clusters, denser and denser
while t < ant - 0.05:
    u = (t - ch0) / span
    fx.add(key(), t, 0.2 + 0.12 * u, pan=float(rng.uniform(-0.6, 0.6)))
    t += float(rng.uniform(0.05, 0.16) * (1.25 - u))
t = ch0 + 0.35  # phone buzzes, more and more often
while t < ant - 0.2:
    u = (t - ch0) / span
    fx.add(buzz(0.26), t, 0.22 + 0.18 * u, pan=float(rng.uniform(-0.5, 0.5)))
    t += 0.75 - 0.45 * u
for c in cue('task'):  # every task: a card hits the pile + a shattered, detuned note of the signature
    u = (c['t'] - ch0) / span
    n = SIG_MINOR[(c['i'] * 3 + c['i'] // 4) % 4] + 12 * (c['i'] % 2)
    fx.add(paper(0.8), c['t'], 0.18 + 0.14 * u, pan=float(np.sin(c['i'] * 2.1)) * 0.5)
    fx.add(ping(midi(n), 1.0, float(rng.uniform(-35, 35))), c['t'] + 0.01, 0.07 + 0.12 * u, pan=float(np.sin(c['i'] * 2.4)) * 0.7)
for c in [{'t': plus_l, 'k': 0}] + cue('swap'):  # headline swaps: clustered e-piano stab + a whip
    root = [50, 51, 52][c['k']]
    music.add(chord(epiano, [root, root + 3, root + 6, root + 11], 0.8, vel=1.0), c['t'], 0.4)
    fx.add(whoosh(0.3, 800, 5000), c['t'] - 0.08, 0.16)
t = ch0  # pressure: dotted-8th bass pulse (3 against the clock's 4) with a b2 rub
while t < ant - 0.05:
    u = (t - ch0) / span
    music.add(bass(midi(26 + 12 + (1 if u > 0.55 and int((t - ch0) / 0.375) % 2 else 0)), 0.3, 1.0), t, 0.42)
    t += 0.375
cl = choir([62, 63, 65, 68], span + 0.1, att=1.2, rel=0.05)  # a cluster choir that swells
tt = t_arr(span + 0.1)
music.add(cl * (0.3 + 0.7 * (tt / span) ** 2), ch0, 0.42, pan=0.2)
fx.add(whoosh(ant - 3.3, 300, 9000, 'rise'), 3.3, 0.45)

# ================================================================ IMPLOSION → SILENCE → RELIEF
rev = np.zeros(int(SR * (impact - ant + 0.05)))  # the signature, played backwards, sucked into the node
for k, n in enumerate(SIG):
    s = kalimba(midi(n), 1.2)[::-1]
    i0 = len(rev) - len(s) - int(k * 0.06 * SR)
    if i0 >= 0:
        rev[i0:i0 + len(s)] += s
    else:
        rev[:i0 + len(s)] += s[-i0:]
fx.add(rev, ant, 0.3)
fx.add(whoosh(impact - ant, 6000, 300, 'rise'), ant, 0.3)
fx.add(thump(1.0, 48, 1.1), impact, 0.5)
fx.add(kalimba(midi(65), 2.6, 0.5), impact + 0.01, 0.12)
fx.add(thump(0.6, 70, 0.4), breath, 0.25)  # one heartbeat on the node's breath
music.add(choir([53, 60, 64, 69], 9.0, att=1.4, rel=1.5, bright=1.3), bloom, 0.2, pan=-0.2)
music.add(chord(epiano, [53, 57, 60, 64, 67], 2.6, vel=0.6), bloom + 0.05, 0.2)
music.add(bass(midi(29 + 12), 2.5, 0.8), bloom + 0.05, 0.25)
fx.add(whoosh(0.9, 200, 2400), bloom, 0.1)
signature(mark + 0.18, fx, step=0.17, vel=0.3)  # the theme, in order, once
for k, n in enumerate([72, 74, 76, 77, 79, 81, 84, 86, 88, 89]):  # letters: a soft marimba run
    fx.add(marimba(midi(n), 0.6), letters + k * 0.032, 0.06, pan=-0.45 + 0.1 * k)
music.add(chord(epiano, [45, 52, 57, 60, 64], 2.0, vel=0.5), tag, 0.14)
for k, n in enumerate([93, 96, 98, 101]):
    fx.add(kalimba(midi(n), 1.0, 0.4), at('sheen') + 0.25 + k * 0.06, 0.03)
fx.add(whoosh(0.45, 2400, 400), dock, 0.1)
fx.add(rim(1.0), header + 0.3, 0.3)
fx.add(marimba(midi(77)), header + 0.3, 0.12)


# ================================================================ GROOVE (dashboard → product → lead)
def groove(b0, b1, full=False, kick_v=0.7):
    for b in np.arange(b0, b1 - 1e-6, BEAT):
        k = int(round((b - b0) / BEAT)) % 4
        if k == 0:
            drums.add(kick(kick_v), b, 0.95)
        if k in (1, 3):
            drums.add(clap(1.0) if full else rim(1.0), b, 0.3 if full else 0.32, pan=0.1)
        if k == 1:
            drums.add(kick(kick_v * 0.8), b + 0.25 + BEAT * (SWING - 0.5), 0.6)  # the "and" of 2, swung
        if full and k == 2:
            drums.add(kick(kick_v), b, 0.7)
    for t, k in swung(b0, b1):
        drums.add(shaker(), t, (0.07 if k % 2 == 0 else 0.045) * (1.3 if full else 1.0), pan=0.35)
    for b in np.arange(b0, b1 - 1e-6, 0.25):  # bass: root, 5th, octave, swung 8ths
        c = chord_at(b)
        step = int(round((b - b0) / 0.25)) % 8
        if step in (0, 3, 4, 6):
            n = ROOT[c] + 12 + {0: 0, 3: 7, 4: 12, 6: 7}[step]
            music.add(bass(midi(n), 0.3, 1.0), b + (0.25 * (SWING - 0.5) * 2 if step % 2 else 0), 0.36)
    for b in np.arange(b0, b1 - 1e-6, 2.0):  # e-piano comping: chord on 1, a pushed stab on the "and" of 3
        c = CH[chord_at(b)]
        music.add(chord(epiano, c, 1.4, vel=0.8), b, 0.3, pan=-0.15)
        music.add(chord(epiano, c[1:], 0.6, vel=0.6), b + 1.25 + 0.25 * (SWING - 0.5) * 2, 0.2, pan=0.2)


groove(G0, LEAD0)
for c in cue('row'):  # ten rows click in: marimba climbs F major
    scale = [65, 69, 72, 74, 76, 77, 79, 81, 84, 86]
    fx.add(marimba(midi(scale[c['i']])), c['t'], 0.2, pan=-0.45 + 0.1 * c['i'])
    fx.add(rim(0.6), c['t'], 0.08)
for k in range(9):  # status wave: tiny kalimba sparkle down the list
    fx.add(kalimba(midi([93, 91, 89, 88, 86, 84, 81, 79, 77][k]), 0.5, 0.5), at('wave') + k * 0.045, 0.025, pan=-0.3 + 0.07 * k)
fx.add(whoosh(0.5, 400, 3000, 'rise'), at('focus') - 0.1, 0.1)
fx.add(whoosh(0.55, 2500, 500), at('morph'), 0.12)
for c in cue('word'):  # Créées. / Suivies. / Optimisées.: two notes of the signature each
    a, b = [(72, 77), (76, 81), (77, 84)][c['k']]
    fx.add(kalimba(midi(a), 1.4), c['t'], 0.16)
    fx.add(kalimba(midi(b), 1.6), c['t'] + 0.12, 0.16)
for c in cue('type'):  # one key per character, backspaces a little duller
    n = max(1, c['n'])
    for k in range(n):
        tk = c['t'] + c['dur'] * (k + 0.5) / n
        fx.add(lp(key(), 3500) if k < c.get('del', 0) else key(), tk, 0.14, pan=float(rng.uniform(-0.3, 0.3)))
fx.add(chord(kalimba, [72, 76, 79], 1.2), at('thumb'), 0.12)
fx.add(key(1.4), at('tap'), 0.3)
lt = at('launch')  # the campaign goes live: the signature on marimba + kalimba, a bass hit
signature(lt + 0.08, fx, step=0.1, inst='marimba', vel=0.22)
signature(lt + 0.08, fx, step=0.1, oct=1, vel=0.12)
fx.add(thump(0.7, 60, 0.5), lt, 0.3)
c0 = at('count')  # odometer ticks, slowing down like the counters
for k in range(22):
    u = k / 21
    fx.add(tick(0.8), c0 + 1.05 * (1 - (1 - u) ** 0.45), 0.05, pan=0.3 * np.sin(k))
for k, n in enumerate([65, 67, 69, 72, 74, 77, 81]):  # the weekly curve draws itself
    fx.add(marimba(midi(n)), at('chart') + 0.85 * (0.5 - 0.5 * np.cos(np.pi * k / 6)), 0.12, pan=-0.4 + 0.13 * k)
fx.add(kalimba(midi(93), 1.8), at('plusone'), 0.2)
fx.add(kalimba(midi(88), 1.6), at('plusone') + 0.07, 0.14)
fx.add(whoosh(0.4, 600, 6000, 'swell'), at('whip') - 0.04, 0.22)
for k, n in enumerate([72, 76, 79]):
    fx.add(marimba(midi(n)), at('grow') + k * 0.1, 0.12)
fx.add(thump(0.5, 90, 0.2), at('strike'), 0.2)
fx.add(whoosh(0.3, 1500, 400), at('strike') + 0.24, 0.1)
fx.add(kalimba(midi(84), 1.2), at('add'), 0.14)
fx.add(kalimba(midi(88), 1.2), at('add') + 0.08, 0.1)
fx.add(kalimba(midi(76), 1.6), at('toast'), 0.16)
fx.add(kalimba(midi(81), 1.8), at('toast') + 0.1, 0.16)
fx.add(whoosh(0.42, 300, 4000, 'rise'), at('push'), 0.14)

# ================================================================ THE LEAD
groove(LEAD0, lock + 0.1, full=True, kick_v=0.8)
fx.add(key(1.4), at('tap', 1), 0.3)
fx.add(whoosh(0.5, 300, 2600), at('open'), 0.14)
fx.add(key(1.4), at('send'), 0.3)
fx.add(thump(0.6, 80, 0.3), at('send') + 0.05, 0.25)
fx.add(whoosh(0.4, 4000, 500), at('squeeze'), 0.12)
tok = at('node') - 0.45  # the token travels: FM glide up, rim roll accelerating, a riser
glen = lock - tok
t = t_arr(glen)
gf = midi(60) * 2 ** (12 * (t / glen) ** 1.5 / 12)
ph = 2 * np.pi * np.cumsum(gf) / SR
fx.add(lp(np.sin(ph + 1.2 * np.sin(ph)), 3000) * (t / glen) ** 0.7 * 0.5, tok, 0.12)
tr = tok
while tr < lock - 0.03:
    u = (tr - tok) / glen
    drums.add(rim(0.9), tr, 0.12 + 0.18 * u, pan=0.15)
    tr += 0.125 if u < 0.5 else 0.0625 if u < 0.85 else 0.03125
fx.add(kalimba(midi(72), 1.6), at('node'), 0.2)
fx.add(whoosh(glen, 400, 8000, 'rise'), tok, 0.14)
fx.add(thump(0.9, 55, 0.6), lock, 0.5)  # Courtier 03 locks
fx.add(kalimba(midi(77), 1.4), lock + 0.01, 0.18)
drop = at('drop', 0, 22.05)
fx.add(whoosh(notify - drop, 5000, 600, 'swell'), drop, 0.16)
# THE DROP: the notification sings the signature; full groove under it
signature(notify + 0.02, fx, step=0.12, inst='bell', vel=0.22, oct=1)
signature(notify + 0.02, fx, step=0.12, vel=0.3)
fx.add(thump(1.0, 50, 0.9), notify, 0.55)
fx.add(hp(rng.standard_normal(int(0.9 * SR)), 5000) * np.exp(-t_arr(0.9) / 0.25), notify, 0.08)
groove(notify, line8, full=True, kick_v=0.95)
music.add(choir([60, 64, 69, 72], line8 - notify + 0.6, att=0.2, rel=0.5, bright=1.5), notify, 0.32, pan=0.25)
for c in cue('haptic'):
    fx.add(buzz(0.24), c['t'], 0.32)
    fx.add(buzz(0.24), c['t'] + 0.32, 0.26)
fx.add(kalimba(midi(84), 1.4), at('crm'), 0.14)
fx.add(kalimba(midi(89), 1.6), at('crm') + 0.08, 0.14)

# ================================================================ THESIS → END
for b in np.arange(line8, mark2 - 0.3, BEAT):  # stripped back: e-piano, bass pulse, soft kick on 1
    if int(round((b - line8) / BEAT)) % 4 == 0:
        drums.add(kick(0.6), b, 0.6)
    music.add(bass(midi(ROOT[chord_at(b)] + 12), 0.3, 0.8), b, 0.3)
for b in (line8, line8 + 1.25):
    music.add(chord(epiano, CH[chord_at(b + 0.01)], 2.0, vel=0.7), b + 0.01, 0.34)
fx.add(whoosh(0.4, 3000, 600), line8, 0.12)
fx.add(thump(0.8, 50, 0.6), at('pas'), 0.45)
fx.add(kalimba(midi(70), 1.4), at('pas'), 0.14)
fx.add(whoosh(mark2 - at('merge'), 400, 6000, 'rise'), at('merge'), 0.14)
# the signature resolves under the logo: kalimba + bell, slower, then F major rings out
signature(mark2 + 0.05, fx, step=0.2, vel=0.32)
signature(mark2 + 0.05, fx, step=0.2, inst='bell', vel=0.12, oct=1)
music.add(chord(epiano, [41, 53, 57, 60, 64, 67], 3.2, vel=0.8), mark2 + 0.85, 0.3)
music.add(choir([53, 60, 64, 69, 72], END - mark2 + 1, att=0.6, rel=1.2, bright=1.4), mark2 + 0.6, 0.26)
music.add(bass(midi(29 + 12), 2.8, 0.9), mark2 + 0.85, 0.3)
fx.add(marimba(midi(84)), at('cta'), 0.12)
fx.add(marimba(midi(89)), at('cta') + 0.1, 0.1)
for k, n in enumerate([96, 100, 103, 108]):
    fx.add(kalimba(midi(n), 1.2, 0.4), at('sheen2') + k * 0.06, 0.03)

# ================================================================ MIX
mus, dr, fxs = music.x, drums.x, fx.x
duck = np.ones(N)  # gentle pump from the groove's downbeats
for b in np.arange(G0, line8, BEAT):
    a = int(b * SR)
    seg = np.arange(int(0.25 * SR)) / SR
    duck[a:a + len(seg)] = np.minimum(duck[a:a + len(seg)], 1 - 0.18 * np.exp(-seg / 0.07))
mus = mus * duck
gate = np.ones(N)


def cut(a, b, fade=0.012):
    """silence music + drums between a and b (short fades)"""
    i0, i1, f = int(a * SR), int(b * SR), int(fade * SR)
    gate[i0:i0 + f] = np.minimum(gate[i0:i0 + f], np.linspace(1, 0, f))
    gate[i0 + f:i1] = 0
    gate[i1:i1 + f] = np.minimum(gate[i1:i1 + f], np.linspace(0, 1, f))


cut(ant, bloom)                     # the validated silence
cut(lock + 0.1, lock + 0.18)        # the 80 ms freeze on Courtier 03
mus, dr = mus * gate, dr * gate
ir_n = int(2.2 * SR)                # one shared room
irt = np.arange(ir_n) / SR
ir = np.stack([lp(rng.standard_normal(ir_n), 5200) * np.exp(-irt / 0.42) for _ in range(2)])
ir[:, :int(0.016 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
send = mus * 0.28 + fxs * 0.5 + dr * 0.06
wet = np.stack([fftconvolve(send[c], ir[c])[:N] for c in range(2)]) * 0.5
bed = hp(mus + dr * 0.8 + wet, 30)
sfx = hp(fxs * 0.9, 30)
mix = bed + sfx
end = int(END * SR)
mix = mix[:, :end]
fade = np.ones(end)
if END > 25:
    f0 = int((END - 0.9) * SR)
    fade[f0:] = np.linspace(1, 0, end - f0) ** 1.5
fade[:int(0.004 * SR)] = np.linspace(0, 1, int(0.004 * SR))
mix *= fade
norm = np.max(np.abs(mix)) + 1e-9
mix /= norm
mix = np.tanh(mix * 1.15) / np.tanh(1.15) * 0.9


def write(path, x):
    pcm = (np.clip(x.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


write(OUT, mix)
if STEMS:  # linear stems for a later voiceover mix
    os.makedirs(STEMS, exist_ok=True)
    g = 0.9 / norm
    write(os.path.join(STEMS, 'bed.wav'), bed[:, :end] * fade * g)
    write(os.path.join(STEMS, 'sfx.wav'), sfx[:, :end] * fade * g)
print('wrote', OUT, f'{END:.2f}s')

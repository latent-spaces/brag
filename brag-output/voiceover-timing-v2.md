# ScaleSuite V2 — voiceover timing sheet

V2 masters: `scalesuite-social-9x16-v2.mp4`, `scalesuite-linkedin-4x5-v2.mp4` (33.45 s, no voice yet).
The picture was retimed with reading holds (`scalesuite-film/src/timemap.js`), and these windows come
from the same time map, so every line lands on the on-screen moment it supports. On-screen text stays
short; the voice complements it and does not subtitle it.

| # | Line (fr-CA) | Window (s) | Anchor moments on screen |
|---|---|---|---|
| 1 | « Vous gérez une équipe de courtiers? » | 0.2 – 2.3 | brokers multiply, 1 → 10 counter |
| 2 | « Quand l'équipe grandit, les campagnes Google Ads se multiplient… et la gestion aussi. » | 2.5 – 6.4 | *campagnes* ≈ 4.3 (« Plus de campagnes. »), *gestion* ≈ 5.3 (« Plus de gestion. »); collapse starts 6.3 |
| 3 | « Avec ScaleSuite, centralisez toute votre équipe dans une seule structure, avec des campagnes personnalisées pour chaque courtier. » | 6.9 – 16.8 | *ScaleSuite* ≈ 6.9–7.7 (logo), *toute votre équipe* ≈ 9.8, *une seule structure* ≈ 12.2, *personnalisées* ≈ 15.5 |
| 4 | « On s'occupe de la création, du suivi et de l'optimisation. » | 18.1 – 21.3 | *création* ≈ 18.3, *suivi* ≈ 19.4, *optimisation* ≈ 20.4 |
| 5 | « Et lorsqu'un lead vendeur entre, il est dirigé vers le bon courtier. » | 21.9 – 25.6 | *lead vendeur* ≈ 23.4 (pill appears), *bon courtier* ≈ 24.2–24.8 (Courtier 03 lights up → CRM) |
| 6 | « Plus de campagnes. Pas plus de gestion. » | 26.2 – 28.7 | line 1 ≈ 26.3, « Pas » lands ≈ 27.3 |
| 7 | « ScaleSuite. » | 30.2 – 31.0 | mark lands ≈ 30.2; CTA settles ≈ 31.6 and holds to 33.45 |

Notes for recording (ElevenLabs or studio):
- Natural, calm Québec delivery ≈ 2.6–2.9 words/s. Line 2 is the tightest window (≈ 4 s); line 3 has
  room for pauses after « ScaleSuite, », « équipe » and « structure, ».
- Easiest workflow: export one file per line and place each at its window start. The picture
  gives the pauses, so no silence needs editing. A single continuous take also works if you pace
  it to the table (use `--offset` to nudge).
- Leave « ScaleSuite. » (line 7) clearly separated; the brand mark lands on it.

## Mixing the voice in

```
cd scalesuite-film
# one file per line
python3 audio/mix_vo.py --stems ../brag-output/audio-v2 --out ../brag-output/work/audio/mix-vo-v2.wav \
  --vo l1.wav@0.2 --vo l2.wav@2.5 --vo l3.wav@6.9 --vo l4.wav@18.1 --vo l5.wav@21.9 --vo l6.wav@26.2 --vo l7.wav@30.2
# then re-mux onto the V2 picture without re-rendering it (the video stream is copied, not re-encoded)
ffmpeg -i ../brag-output/scalesuite-social-9x16-v2.mp4 -i ../brag-output/work/audio/mix-vo-v2.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart scalesuite-social-9x16-v2-vo.mp4
```

The mixer keeps the voice dominant. Music is ducked about −9 dB under speech and SFX about −4 dB,
with a smooth 120 ms attack, 500 ms release and 80 ms lookahead. The voice itself is not compressed.
The mix is normalised to −14 LUFS with a −1.5 dBTP ceiling. `VO=… ./build.sh final v2` does the
same as part of a full render.

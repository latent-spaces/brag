# ScaleSuite V3 : feuille de timing pour la voix off

Master V3 : `scalesuite-social-9x16-v3.mp4`, 31,0 s, sans voix pour l'instant. Les fenêtres
ci-dessous viennent des repères exportés par la timeline GSAP (`work-v3/cues-v3.json`). Chaque
réplique tombe donc sur le moment à l'écran qu'elle accompagne. Le texte à l'écran reste court : la
voix le complète au lieu de le sous-titrer, sauf pour la thèse, reprise en écho.

| # | Réplique (fr-CA) | Fenêtre (s) | Moments d'ancrage à l'écran |
|---|---|---|---|
| 1 | « Vous gérez une équipe de courtiers? » | 0,2 – 2,1 | les cartes se multiplient, compteur de 1 à 10 |
| 2 | « Chaque courtier de plus… c'est encore plus à gérer. » | 2,5 – 4,9 | plongée à 2,2 s ; changements de mot à 3,42 et 4,17 s |
| — | *(silence)* | 5,0 – 6,3 | implosion, impact à 5,53 s, le nœud respire seul (silence validé) |
| 3 | « Avec ScaleSuite, toute votre équipe passe par une seule structure. » | 6,5 – 10,4 | *ScaleSuite* ≈ 6,5–7,2 (la marque apparaît à 6,36 s) ; *une seule structure* ≈ 9,4–10,2 (lignes posées de 8,9 à 9,4 s) |
| 4 | « Chaque courtier a sa propre campagne. » | 11,1 – 13,2 | « Créées. » à 11,02 s ; lancement à 13,26 s |
| 5 | « Suivie et optimisée par notre IA et notre équipe. » | 14,1 – 17,3 | « Suivies. » à 13,98 s, +1 lead à 15,2 s, *optimisée* ≈ 15,9 s (« Optimisées. » à 15,86 s), message de confirmation à 17,33 s |
| 6 | « Un vendeur cherche, clique, remplit le formulaire… » | 18,2 – 20,6 | appui sur l'annonce à 19,15 s, page à 19,3 s, « Envoyer » à 20,42 s |
| 7 | « …et le lead va au bon courtier, directement dans son CRM. » | 20,9 – 24,3 | nœud à 21,35 s, verrouillage sur Courtier 03 à 21,85 s, notification à 22,5 s (*bon courtier* ≈ 22,3–22,8), CRM à 23,0 s |
| 8 | « Plus de campagnes. Pas plus de gestion. » | 25,1 – 27,2 | ligne de séparation à 25,05 s, « Pas » à 25,72 s |
| 9 | « ScaleSuite. Demandez une démo. » | 27,8 – 29,6 | la marque à 27,7 s, le bouton à 28,12 s ; tout est posé à ≈ 29,0 s et tenu jusqu'à 31,0 s |

Notes pour l'enregistrement (ElevenLabs ou studio) :

- **Débit** : livraison québécoise naturelle et posée, d'environ 2,7 à 3 mots par seconde. Les
  fenêtres les plus serrées sont les répliques 2 et 8.
- **Silence** : rien entre 5,0 et 6,3 s. Le silence fait partie du récit (la bascule vers le
  soulagement).
- **Le plus simple** : exporter un fichier par réplique et le placer au début de sa fenêtre.

## Mixer la voix

Le mixeur de la V2 fonctionne tel quel avec les pistes V3 (`audio-v3/bed.flac`, `audio-v3/sfx.flac`) :

```
cd scalesuite-film
python3 audio/mix_vo.py --stems ../brag-output/audio-v3 --out ../brag-output/work-v3/mix-vo-v3.wav \
  --vo l1.wav@0.2 --vo l2.wav@2.5 --vo l3.wav@6.5 --vo l4.wav@11.1 --vo l5.wav@14.1 \
  --vo l6.wav@18.2 --vo l7.wav@20.9 --vo l8.wav@25.1 --vo l9.wav@27.8
ffmpeg -i ../brag-output/scalesuite-social-9x16-v3.mp4 -i ../brag-output/work-v3/mix-vo-v3.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart scalesuite-social-9x16-v3-vo.mp4
```

Sous la voix, la musique est atténuée d'environ −9 dB et les effets d'environ −4 dB. Le mix est
normalisé à −14 LUFS, avec un plafond de −1,5 dBTP.

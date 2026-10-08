---
name: scalesuite-video
description: >-
  Produire ou modifier une vidéo marketing ScaleSuite (Google Ads pour courtiers et agences
  immobilières du Québec) au niveau de la V3 : pipeline HTML/SVG + timeline GSAP en pause rendu
  image par image avec Playwright, Design DNA, règles de lisibilité mobile, règles de mouvement,
  composants réutilisables, règles de contenu et processus de validation. À utiliser dès qu'on
  parle de la vidéo ScaleSuite, d'une V4 ou nouvelle version, d'un nouveau format (4:5, 1:1, 16:9),
  d'une nouvelle scène, d'une correction de texte ou de timing, d'un nouveau rendu, de la musique ou
  de la voix off du film, dans ce dépôt (dossier scalesuite-film/).
---

# ScaleSuite video (niveau V3)

La V3 (`brag-output/scalesuite-social-9x16-v3.mp4`, 31 s, 9:16) est la référence de qualité. Ce
document permet de la refaire, de la modifier ou d'en produire une nouvelle version sans repartir de
zéro.

Les documents de la V3 :
- `brag-output/storyboard-v3.md` : plan validé, avec la section « Réalisation ».
- `brag-output/design-dna-v3.json` : Design DNA.
- `brag-output/voiceover-timing-v3.md` : timing de la voix off.
- `scalesuite-film/README-v3.md` : notes techniques.

## 0. Avant de toucher au code

1. Lire les skills du projet : `motion-design` (au complet, avec `director/` et `reference/`),
   `design-dna`, et `gsap-core`, `gsap-timeline`, `gsap-utils`, `gsap-performance`. Les skills
   Remotion ne s'appliquent pas : ce projet n'utilise pas Remotion.
2. Regarder la version précédente : sa planche contact (`brag-output/scalesuite-contact-sheet-v3.jpg`)
   et son storyboard.
3. **Ne jamais modifier ni écraser une version précédente.** Chaque nouvelle version a son suffixe
   (`-v4`…) sur tous ses fichiers, sources et sorties. La V3 charge `core.js`, `logo.js` et
   `styles.css` (V2) en lecture seule. Une V4 peut charger `core-v3.js` en lecture seule, ou le
   copier en `core-v4.js` si elle doit le changer.

## 1. Processus de travail (obligatoire, dans cet ordre)

1. **Plan scène par scène**, présenté à l'utilisateur sous forme de tableau : temps, durée, ce qu'on
   voit, mouvement de caméra, transition vers la scène suivante. Y ajouter la courbe de rythme, les
   règles de lisibilité, la chorégraphie et le son. Sauvegarder le plan dans
   `brag-output/storyboard-vN.md`. Lister les choix qui demandent un arbitrage avec une
   recommandation pour chacun, puis **attendre la validation**.
2. **Aperçu basse résolution des trois premières scènes** : `END=<fin scène 3> ./build-vN.sh preview`.
   Envoyer la vidéo 540 × 960 et la planche contact (une rangée par scène) avec `SendUserFile`, pour
   que l'utilisateur puisse valider sans télécharger. **Attendre la validation.**
3. **Scènes restantes.** Vérifier en images fixes (`render/stills-v3.mjs`) au fil de l'eau.
4. **Aperçu complet et planche contact** (`./build-vN.sh preview`), puis **master**
   (`./build-vN.sh final`), puis la **feuille de timing de la voix off**.
5. **Contrôle qualité** (section 11). Ensuite `git add -f` des sorties (`brag-output/` et `.claude/`
   sont dans le `.gitignore`), commit, push sur la branche de travail, et envoi des fichiers.

Ce qui a été validé par l'utilisateur pour la V3, à garder par défaut :
- l'intensité du chaos et la durée du silence après l'implosion ;
- le rouge, réservé au chaos ;
- le voile clair derrière les titres posés sur une interface en mouvement ;
- le comptage de 1 à 10 en 0,7 s ;
- des valeurs d'interface ordinaires, sans pourcentage ;
- le fond clair partout, le contraste sombre étant réservé au jeton du lead ;
- le 4:5 seulement après validation du 9:16.

La musique de la V2 a été jugée « générique » : la V3 la remplace par une signature (section 10).

## 2. Pipeline de rendu

Chaque image est une fonction pure du temps `t`. Une page HTML/CSS/SVG construit toutes les scènes
une seule fois, et une **timeline GSAP en pause** (`SS.tl`) porte toute la chorégraphie. Pour chaque
image, `SS.renderFrame(t)` exécute :
1. `SS.tl.seek(t)` ;
2. le `render(t)` procédural de chaque scène (matrice caméra, tremblement, compteurs, frappe, flou
   de vitesse) ;
3. une capture CDP par Playwright.

ffmpeg encode ensuite les images, et la musique est synthétisée en Python sur des repères exportés
par la timeline.

**Prérequis** : Node 22 avec Playwright global (`/opt/node22/lib/node_modules/playwright`, déjà pris
en charge par `render/lib.mjs`), Chromium préinstallé (ne pas lancer `playwright install`), ffmpeg,
Python 3 avec numpy, scipy et pillow (`pip install scipy` s'il manque).

```bash
cd scalesuite-film
END=8.5 ./build-v3.sh preview   # 0–8,5 s (scènes 1–3) : aperçu 540×960 30 fps + planche contact   (~1 min)
./build-v3.sh preview           # film complet : aperçu 540×960 30 fps + planche contact          (~3 min)
./build-v3.sh final             # master 1080×1920 60 fps, image 0 = affiche, JPEG d'affiche, pistes audio (~5,5 min)

node render/stills-v3.mjs --times=2.0,12.5 --out=/chemin/dossier [--names=a,b]   # images fixes 1080×1920
node render/cues-v3.mjs > cues.json                                              # repères son exportés par la timeline
node render/check-v3.mjs determinism                                             # contrôle : même image quel que soit l'historique
node render/check-v3.mjs motion 31                                               # contrôle : pas de saut isolé d'une image à l'autre
npx http-server . -p 8080   # puis /index-v3.html?t=12.3 (image fixe) ou ?play&t=8&end=12 (lecture temps réel)
```

**Sorties** (`brag-output/`) :
- `scalesuite-social-9x16-v3.mp4` (H.264 yuv420p bt709, faststart, AAC 192k)
- `previews/scalesuite-preview-9x16-30fps-v3[-s1-3].mp4`
- `scalesuite-contact-sheet-v3[-s1-3].jpg`
- `scalesuite-preview-v3.jpg` (affiche, t = 2,0 s)
- `audio-v3/` : `music-v3.flac`, ainsi que `bed.flac` et `sfx.flac` pour `audio/mix_vo.py`

Les intermédiaires vont dans `brag-output/work-v3/` et ne sont pas versionnés.

**Pièges du pipeline** :
- Chrome ignore un `deviceScaleFactor` inférieur à 1 pour les captures. On rend donc toujours en
  1080 × 1920 et on réduit avec ffmpeg (lanczos).
- Les rangées de la planche contact sont dans le tableau `ROWS` de `build-v3.sh` (titre, instants).
  Il faut les mettre à jour quand le timing change.

| Fichier | Rôle |
|---|---|
| `index-v3.html` | ordre de chargement : `styles.css`, `styles-v3.css`, `vendor/gsap-3.13.0`, `core.js`, `logo.js`, `core-v3.js`, scènes, `film-v3.js` |
| `src/core.js` (V2, lecture seule) | `SS.el`, `SS.svg`, `SS.text` (mots masqués), `SS.icon`, `SS.check`, `SS.logo`, `SS.odometer`, `SS.grain`, `SS.C` (couleurs), `SS.rng` |
| `src/core-v3.js` | GSAP (`SS.tl`, `SS.EZ`), caméras, `SS.place`, `SS.wordsIn/Out`, `SS.typer`, `SS.counter`, `SS.band`, `SS.scrim`, `SS.blur`, `SS.cue`, `SS.proc` |
| `src/film-v3.js` | démarrage, `SS.renderFrame(t)`, `SS.DURATION`, `SS.POSTER_T`, visibilité des calques (union des plages) |
| `src/scenes-v3/00…07-*.js` | une scène ou un groupe de scènes par fichier, timing dans un objet `T` en tête de fichier |
| `src/styles-v3.css` | classes `.a3`, `.card3`, `.chip3`, `.badge3`, `.task3`, `.world` (aucun `will-change`) |
| `render/lib-v3.mjs`, `frames-v3.mjs`, `stills-v3.mjs`, `cues-v3.mjs`, `check-v3.mjs`, `sheet-v3.py` | rendu, repères, contrôle qualité, planche contact |
| `audio/music-v3.py` | partition synthétisée sur les repères ; `audio/mix_vo.py` (V2) mixe la voix sur les pistes V3 |
| `build-v3.sh` | `preview` / `final` |

**Timeline de la V3** (31 s) :

| Scène | Temps | Fichier |
|---|---|---|
| 1 · Accroche | 0–2,5 | `01-hook` |
| 2 · Chaos | 2,5–5,5 | `02-chaos` |
| 3 · Soulagement | 5,5–8,5 | `03-relief` |
| 4 · Structure | 8,5–11 | `04-structure` |
| 5–7 · Créées, Suivies, Optimisées | 11–18 | `05-campaign` |
| 8 · Le lead | 18–25 | `06-lead` |
| 9–10 · Thèse et appel à l'action | 25–31 | `07-finale` |

Les **raccords entre calques** doivent être identiques au pixel près au moment du passage. Le
dernier tween du calque sortant doit donc être fini à cet instant :
- **8,5 s** : en-tête en espace écran (scène 3) → tableau de bord dans le monde ;
- **18,0 s** : annonce du monde → annonce de la scène du lead ;
- **20,9 s** : bouton « Envoyer » rogné → jeton autonome ;
- **25,05 s** : notification aplatie → ligne de la thèse.

## 3. Écrire une scène (gabarit)

```js
(function () {
  const SS = window.SS;
  const T = { in: 11.0, swap: 12.4, out: 13.9 };         // tout le timing de la scène ici
  let R;
  function build(stage) {
    const layer = SS.el('div', 'layer', stage);         // espace écran ; ou SS.world (monde caméra)
    const card = SS.el('div', 'a3 card3', layer);
    SS.place(card, 540, 900, { autoAlpha: 0, y: 930 });  // état initial EXPLICITE de chaque propriété animée
    SS.tl.fromTo(card, { autoAlpha: 0, y: 930 }, { autoAlpha: 1, y: 900, duration: 0.5, ease: SS.EZ.out }, T.in);
    const head = SS.text(layer, 'Une seule\n*structure.*', { size: 124 });
    SS.place(head.el, 540, 364); SS.hideWords(head);
    SS.wordsIn(head, T.in, { st: 0.07 }); SS.wordsOut(head, T.out);
    SS.camTo(T.in, 0.6, SS.EZ.cam, { y: 1236, s: 1.16 }); // clés caméra enchaînées, sans chevauchement
    SS.cue(T.in, 'mon-evenement');                        // repère pour la musique
    R = { layer };
  }
  function render(t) { /* état procédural, fonction de t seulement */ }
  const scene = { name: 'ma-scene', a: -1, b: 99, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.layer, 10.9, 14.0]]; };
  SS.scenes.push(scene);
})();
```

**API utile** :

| Fonction | Rôle |
|---|---|
| `SS.place(el, x, y, extra)` | centre un élément (`.a3`) via le cache de transformations de GSAP |
| `SS.text(parent, 'Plus de *gestion.*', {size, weight, color, maxW, lh})` | mots masqués : `*…*` donne la couleur d'accent, `_` lie deux mots dans le même masque |
| `SS.wordsIn` / `SS.wordsOut` / `SS.hideWords` | montée ou sortie des mots dans leur masque |
| `SS.band(parent, top, h)` | bande de rognage : un mot qui change ne glisse jamais sur la ligne du dessus |
| `SS.scrim(parent, h)` | voile clair derrière un titre posé sur une interface en mouvement |
| `SS.camTo(at, dur, ease, {x,y,s,r})` / `SS.camFx(at, dur, ease, from, to)` | caméra du monde, et flou (`blur`) ou tremblement (`shake`, `shakeR`) |
| `SS.camera(proxy)` | seconde caméra pour un autre monde (voir `06-lead`) |
| `SS.typer(el, [{at, dur, to, silent}], caret)` | frappe caractère par caractère, avec suppression jusqu'au préfixe commun |
| `SS.counter(el, [{at, dur, from, to, ease}])` | compteur avec espace fine (2 418) |
| `SS.proc(fn)` | mise à jour procédurale à chaque image |
| `SS.blur(el, px)` | flou de vitesse procédural |
| `SS.logo(parent, h, {word})` | logo : `.mark(k)`, `.sheen(k)`, `.letters` |
| `SS.check(parent, size)` | coche dessinée : `.set(k)` |

## 4. Règles de déterminisme (le rendu en dépend)

Le contrôle `node render/check-v3.mjs determinism` doit afficher `0 DOM differences`. Le bruit de
pixel inférieur ou égal à 2/255 est normal.

1. **Uniquement `fromTo()`, avec des valeurs de départ explicites**, et l'état initial de chaque
   propriété animée fixé à la construction (`gsap.set`). La timeline a `immediateRender: false` par
   défaut.
2. **Jamais deux tweens sur la même propriété du même élément en même temps** : le résultat
   dépendrait de l'ordre de rendu. Ce cas est déjà arrivé, avec une tâche qui atterrissait encore
   quand l'implosion commençait.
3. **Une propriété est pilotée soit par GSAP, soit par un `render(t)`, jamais par les deux.** Les
   valeurs procédurales passent par des objets « proxy » que GSAP anime.
4. **Le flou est toujours procédural** (`SS.blur`). Un filtre GSAP rembobiné laisse `blur(0px)`,
   qui ne se rend pas comme `none`.
5. **Arrondir les valeurs aléatoires** à la construction (rotations à 0,01°), pour que GSAP écrive
   la même chaîne de transformation.
6. **Ne jamais passer un objet partagé à `gsap.set`** : GSAP y écrit `duration` (bug de caméra
   constaté). Toujours passer une copie.
7. **Un `render(t)` doit tourner pour tout `t` où l'état peut différer** (`a: -1, b: 99`). Sinon
   l'état reste périmé après un retour en arrière, par exemple pour l'image d'affiche rendue en
   premier.
8. **Une instruction `gsap.set` par ligne.** Un commentaire `//` ajouté en fin de ligne a déjà
   avalé les états initiaux qui suivaient.
9. **Aucun `will-change`, et `gsap.config({force3D:false})`.** Sinon Chrome garde la rastérisation
   initiale et le texte devient flou dans les zooms.
10. **`clip-path` rogne aussi l'ombre.** Une carte entièrement ouverte utilise donc l'encart négatif
    `inset(-80px … round 114px)` (« OPEN ») pour garder son ombre.
11. **Les mesures (`getBoundingClientRect`) se font à la construction**, monde non transformé et
    calques visibles.

## 5. Design DNA (`brag-output/design-dna-v3.json`)

**Couleurs** :
- fond `#F7FBFA` (mesuré `#F6FAF9`) et menthe `#E8F9F7`, qui couvrent environ 90 % de l'image ;
- cartes `#FFFFFF` ; encre `#1A1A1A` ; texte secondaire `#5E6B69` ; squelettes `#E6EEEC` ;
- turquoise `#2BBFB3` (lignes, nœuds, halos ; mot d'accent `#14A89B`) et vert `#1D9E75` (succès,
  « Active », avatars) ;
- bouton d'appel en dégradé à 135°, de `#2BBFB3` à `#1D9E75` ;
- couleur d'agence fictive `#2F5D8C` (« VOTRE AGENCE », distincte de ScaleSuite) ;
- avertissement `#E8A33D` et rouge `#E5484D`, **dans le chaos seulement** ;
- encre sombre réservée au **jeton du lead**.

**Typographie** : Inter (auto-hébergée dans `assets/fonts`), titres en 800 avec un interlettrage de
−0,04 em, en casse de phrase, 1 à 4 mots par ligne.
- mot seul (« Créées. ») : 150 px ;
- titres : 116 à 124 px ;
- thèse : 118 px ;
- interface : 40 px (principal), 32 à 36 px, minimum 30 px ;
- chiffres de tuiles : 72 px, chiffres tabulaires.

**Formes** :
- rayons : cartes 26 à 36 px, lignes 18 px, pastilles 999 px ;
- ombres douces teintées de menthe (bas, moyen, haut dans le JSON) ;
- anneau d'encre de 1 px à 4,5 % ;
- halo turquoise de 3 à 4 px pour l'élément actif.

**Motifs** : ligne de routage turquoise tracée (`stroke-dashoffset`), nœud vert avec halo menthe,
disque menthe qui éclot, logo révélé par balayage avec reflet, grain statique, et deux lumières
menthe qui dérivent en arrière-plan.

**Ambiance** : calme, précis, confiant, frais, rassurant. C'est un film produit éditorial B2B,
centré, sans photos ni visages.

## 6. Lisibilité mobile (9:16, canevas 1080 × 1920)

- **Interface d'au moins 760 px de large, soit 70 % du cadre.** Cible : 860 à 900 px (80 à 83 %).
- **Taille à l'écran = taille dans le monde × échelle de la caméra.** Minimum **30 px à l'écran**
  (≈ 11 pt sur un téléphone), **40 px** pour les libellés principaux, 116 à 150 px pour les titres.
  Dans le monde, une tâche du chaos peut être en 27 px parce que la caméra est à 2×.
- **Zoomer sur le détail** (échelle de caméra de 1,1 à 1,3, jusqu'à 2 dans le chaos) plutôt que
  montrer tout l'écran en petit. Un téléphone peut être cadré serré et coupé par le bas.
- **Zones sûres** :
  - titres entre y 200 et 560, produit entre y 600 et 1500 ;
  - rien de critique sous y 1500 (légendes de la plateforme) ;
  - texte critique à x < 930 (rail droit), donc aligné à gauche dans les cartes.
- **Titre posé sur une interface en mouvement** : `SS.scrim` (520 à 680 px). Un mot qui change de
  ligne passe par `SS.band`.

## 7. Règles de mouvement

**Personnalité** : 90 % corporate/premium, avec un dépassement emprunté au registre ludique
**seulement sur les éléments héros**.

**Courbes (`SS.EZ`)** :

| Nom | Courbe | Usage |
|---|---|---|
| `out` | `.16,1,.3,1` | entrées |
| `inOut` | `.65,0,.35,1` | caméra et mouvements à l'écran |
| `in` | `.7,0,.84,0` | sorties |
| `cam` | `.55,0,.18,1.06` | caméra avec léger dépassement à l'arrivée |

**Dépassement** :

| Ease | Dépassement | Usage |
|---|---|---|
| `dock` = `back.out(1.1)` | ≈ 4,5 % | lignes qui s'emboîtent |
| `pop` = `back.out(1.7)` | ≈ 10 % | statut, bouton d'appel, pastilles |
| `pop12` = `back.out(1.9)` | ≈ 12 % | notification |

Jamais de dépassement sur un titre ou un fond.

**Aucune interpolation linéaire** pour un mouvement dans l'espace. Seule la frappe avance caractère
par caractère. `'none'` n'est permis que sur un proxy dont la fonction applique elle-même son
easing (`logo.mark`, `check.set`).

**Entrées décalées** de 35 à 80 ms, avec un total de moins de 500 ms par groupe. Exception : le
comptage narratif. Les enfants suivent leur parent avec 60 à 100 ms de retard. Pour une
accélération (chaos, comptage), on espace les instants de départ selon une loi de puissance.

**Durées** : rapide 180 ms, standard 320 ms, lent 650 ms, soulagement 600 à 900 ms.

**Courbe de rythme et durées inégales** : chaos rapide et étouffant (changements de titre à 3,42 et 4,17 s, soit 0,9 → 0,75 s,
40 tâches de plus en plus rapprochées, tremblement croissant), vrai silence, montée régulière (scènes produit de 3,0 →
2,0 → 2,0 s), puis le climax, qui est la scène la plus longue (7 s) et culmine vers 73 % du film.

**Transitions motivées uniquement**. Catalogue V3 :
- zoom brusque ;
- implosion avec anticipation (gonflement de 3 %, puis aspiration en `power3.in`) ;
- nœud qui éclot en disque ;
- élément partagé (logo vers l'en-tête, ligne vers la carte, titre d'annonce vers le titre de la
  page) ;
- panoramique continu le long d'une carte ;
- coup de fouet avec flou de vitesse ;
- zoom à travers (le panneau se resserre autour de l'annonce) ;
- page compressée en jeton ;
- jeton qui suit une route ;
- jeton qui se déplie en notification ;
- notification aplatie en ligne ;
- ligne contractée en nœud, puis en logo.

**Aucune transparence de scène** :
- jamais de fondu enchaîné entre scènes ;
- l'opacité ne sert qu'à de petits éléments secondaires, toujours avec un mouvement ou une échelle ;
- un élément « posé » apparaît opaque, sans fondu (les tâches du chaos) ;
- les fondus sont admis pour la lumière ambiante, le voile et l'atténuation d'éléments hors focus
  (à 25–30 %).

**Règles de `motion-design`** : trois couches (primaire, secondaire, ambiante) ; règle du tiers (au-delà
d'un tiers d'écran, un coup de fouet avec flou ou une clé intermédiaire) ; un héros par temps.

## 8. Composants réutilisables (où les trouver, dimensions)

| Composant | Source | Spécifications |
|---|---|---|
| Carte courtier | `01-hook` (`.card3`) | 430×150, avatar 80, « Courtier 0X » 40 px, ligne 2 squelette → pastille « ◎ Campagne » 30 px, pastille rouge (chaos) ; grille 2×5 à x 315 et 765, rangées à 172 px d'intervalle |
| Carte tâche (chaos) | `02-chaos` (`.task3`) | case à cocher, tâche 27 px et « Courtier 0X » 22 px (dans le monde, caméra ≈ 2×), point ambre |
| Tableau de bord | `04-structure` | carte 900 de large, en-tête 124 (logo 66 + « Tableau de bord · Votre agence »), 10 lignes de 864×72 à 79 px d'intervalle ; `SS.rowHTML(i, {draft})` et `SS.rowStyle` (réutilisés en scène 8) |
| Carte de campagne | `05-campaign` | 900×1660 ; démarre comme copie exacte de la ligne 03 (rognage) ; champs (libellé 30 et valeur tapée 40) ; miniature de page aux couleurs de l'agence 840×300 ; bouton « Lancer la campagne » qui se rétracte en pastille « ● Active » ; section Performance (3 tuiles 264×200, courbe 840×250 tracée, +1 sur Leads) |
| Panneau d'optimisation | `05-campaign` | 900×920 ; mots-clés (36 px, barres) qui grandissent, sont barrés et sortent, ou sont ajoutés ; `SS.adCard(parent, titre)` (900×250, partagé avec la scène 8) ; message « ✓ Optimisation appliquée » |
| Recherche, page de destination | `06-lead` | barre 900×112 tapée ; résultats organiques en squelette ; page 900×960 (barre d'agence, titre partagé, formulaire tapé, bouton « Envoyer ») |
| Jeton du lead | `06-lead` (`tokenEl`) | pastille d'encre 460×100, « ● LEAD VENDEUR » 34 px ; trajet procédural (proxys `u1`, `u2`, `u3`) : page → nœud ScaleSuite → ligne 03 → téléphone |
| Téléphone et notification | `06-lead` | téléphone clair 820×1700 (date et heure de l'écran verrouillé) ; notification 760×300 qui se déplie depuis le jeton, avec vibration (3 oscillations amorties) et « ✓ Ajouté à votre CRM » |
| Thèse et appel à l'action | `07-finale` | ligne 780×6 entre « Plus de campagnes. » et « Pas plus de gestion. » (« Pas » tombe en place), grille de nœuds ; logo complet 196, slogan 44, bouton 700×136 qui naît d'un nœud, URL 40 |
| Logo | `core.js` `SS.logo` | marque balayée, lettres qui montent une à une, reflet ; version marque seule `{word:false}` |

## 9. Règles de contenu

- **Affirmations vérifiables sur scalesuiteqc.ca/fr uniquement** :
  - Google Ads pour équipes et agences immobilières du Québec ;
  - compte et tableau de bord centralisés pour plusieurs courtiers ;
  - campagnes personnalisées par courtier ;
  - pages de destination aux couleurs de l'agence ;
  - création, suivi et optimisation par l'IA et l'équipe ;
  - API Google Ads officielle ;
  - leads livrés au CRM ;
  - appel « Demander une démo ».
- **Valeurs d'interface ordinaires** (2 418 impressions, 186 clics, 7 leads). **Aucun
  pourcentage, aucune promesse de résultat**, aucun prix, aucun superlatif (« la première », « la
  meilleure »), pas d'essai gratuit.
- **Aucun nom réel ni visage.** Les courtiers sont « Courtier 01…10 », l'agence est « Votre
  agence » ou « VOTRE AGENCE ».
- **Langue** : français québécois. Accorder « Créées. Suivies. Optimisées. » avec « campagnes ». Le
  mot « lead » est admis.
- **Relire tout le texte à l'écran avant chaque master**, y compris les détails : la date de
  l'écran verrouillé doit correspondre au jour de la semaine de l'année de diffusion. En 2026, le
  13 octobre tombe un mardi.
- **Libellé Google en fr-CA** : l'annonce affiche « Sponsorisé » (repris de la V2). Google en
  français canadien utilise en général « Commandité ». Faire trancher par l'utilisateur.

## 10. Son (`audio/music-v3.py`)

La partition est construite autour d'une **signature de quatre notes** : do5, fa5, mi5, la5 (quarte
montante, demi-ton descendant, quarte montante). C'est le logo sonore.
- **Chaos** : la signature est éclatée en ré mineur harmonique (pings de notification désaccordés),
  avec clics de clavier, vibrations, tic-tac qui accélère, basse en croches pointées et chœur en
  grappe. Pas de kick régulier.
- **Silence** : de l'anticipation jusqu'à l'éclosion, avec la signature jouée à l'envers et aspirée.
- **Soulagement** : la signature jouée une fois, proprement, au kalimba.
- **Scènes produit** : groove néo-soul swingué (58 %), piano électrique FM, marimba, basse ronde,
  rim et shaker. Chaque ligne, champ ou compteur a son son.
- **Lead** : montée, gel de 80 ms au verrouillage, puis le drop. La notification chante la
  signature.
- **Fin** : résolution en fa majeur.

Tout effet est posé sur un repère `SS.cue(t, 'type', …)` exporté par `render/cues-v3.mjs`. **Une
nouvelle scène doit donc ajouter ses repères, et la partition doit les utiliser.** Le mix est à
−15 LUFS / −1,5 dBTP ; `build-v3.sh` fait la normalisation en deux passes. Pour la voix off :
`audio/mix_vo.py --stems ../brag-output/audio-v3`, avec atténuation de la musique (−9 dB) et des
effets (−4 dB), à −14 LUFS. Les fenêtres sont dans `voiceover-timing-v3.md`.

## 11. Contrôle qualité avant de livrer

1. **Planche contact** relue scène par scène, et images fixes en pleine résolution sur les moments
   délicats (changements de mot, raccords, états de boutons). Vérifier qu'aucun état « d'après »
   n'apparaît avant son déclencheur.
2. `node render/check-v3.mjs determinism` doit afficher **OK** (0 différence de DOM).
3. `node render/check-v3.mjs motion 31` doit afficher **OK** : aucun saut isolé, chaque grand
   mouvement monte et redescend sur plusieurs images. Les raccords (8,5 / 18,0 / 20,9 / 25,05 s)
   doivent rester faibles (de l'ordre de 1 au plus).
4. **Lisibilité** : aucun texte sous 30 px à l'écran, interface d'au moins 760 px de large.
5. **Son** : courbe de sonie (ebur128) cohérente avec le récit (chaos qui monte, silence,
   soulagement doux, climax le plus fort, fin légèrement en dessous) et −15 LUFS intégrés.
6. **Master** : `ffprobe` doit donner 1080×1920, 60 fps, yuv420p et la bonne durée. Extraire
   quelques images du MP4 lui-même.

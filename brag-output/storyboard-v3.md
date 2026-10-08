# ScaleSuite V3 : plan scène par scène (à valider)

Film d'acquisition · 9:16 (1080 × 1920) · environ 31 s · 60 fps · fonctionne sans le son · français (Québec)

Le récit et l'identité de la V2 ne changent pas. La V3 corrige la lisibilité mobile, les transitions, le
rythme, la démonstration du produit et la chorégraphie.

Identité : `brag-output/design-dna-v3.json`, extraite de la V2 (couleurs mesurées sur les masters
avec `design-dna/scripts/measure-colors.mjs`). Fond `#F7FBFA` / menthe `#E8F9F7`, encre `#1A1A1A`,
turquoise `#2BBFB3`, vert `#1D9E75`, police Inter 800, logo vectorisé, ligne de routage, nœud vert et
panneau menthe.

---

## Règles de la V3

### 1. Lisibilité mobile

- Chaque bloc d'interface fait au moins **760 px de large, soit 70 % du cadre**. La cible est de
  860 à 900 px (80 à 83 %). En V2, le tableau de bord occupait 600 px (56 %).
- Tailles de texte minimales sur le canevas de 1080 px, soit environ 0,36 pt par px sur un téléphone :
  libellés principaux **40 px (≈ 14 pt)**, texte secondaire **32 px**, et **jamais moins de 30 px**.
  En V2, l'interface allait de 19 à 29 px, soit 7 à 10 pt sur un téléphone.
- Une **caméra-monde** applique une seule transformation (translation, échelle, rotation) au calque
  du monde. On cadre le détail utile à une échelle d'au moins 1, au lieu de montrer tout l'écran en petit.
- Zones sûres 9:16 : titres entre y 200 et 560, produit entre y 600 et 1500. Le texte critique est
  aligné à gauche dans les cartes, donc x < 930. Le rail droit (x > 940) ne reçoit que des bords et
  des pastilles d'état.

### 2. Transitions motivées, sans fondu

Chaque scène naît d'un objet de la scène précédente : un élément qui se transforme, une poussée ou
un panoramique de caméra, une forme qui devient la scène suivante. Aucune scène n'est jamais
semi-transparente. L'opacité ne sert qu'à de petits éléments secondaires et toujours avec un
mouvement ou une échelle.

### 3. Courbe de rythme

```
énergie
  ▲                                                   ★ notification
  │      ███                                         ███
  │    ██████                                     ██████
  │  ████████▌                          ▄▄▄▄▄▄▄███████████
  │ █████████▌             ▄▄▄▄▄▄▄▄▄▄▄█████████████████████▄
  │██████████▌    ▄▄▄▄▄▄▄██████████████████████████████████████▄▄▄▄▄▄
  │██████████▌ ▁▁▁████████████████████████████████████████████████████████
  └─────────────────────────────────────────────────────────────────────▶ t
   0   accroche/chaos   5,5 soulagement  8,5 structure → produit  18 LEAD  25 thèse/CTA 31
```

- **Chaos (0 à 5,5 s)** : rapide et étouffant. Les changements de plan accélèrent (1,0 s → 0,8 →
  0,6), le cadre est serré et les cartes débordent. Une micro-secousse grandit.
- **Soulagement (5,5 à 8,5 s)** : 0,3 s de vide et de silence, puis les mouvements les plus lents du
  film (600 à 900 ms), avec beaucoup d'espace blanc.
- **Montée (8,5 à 18 s)** : un groove régulier. Les scènes produit raccourcissent (3,0 → 2,0 → 2,0 s)
  à l'approche du lead.
- **Point culminant (18 à 25 s)** : la scène la plus longue. Elle accélère en interne jusqu'à la
  notification (≈ 22,6 s, à 73 % du film).
- **Résolution (25 à 31 s)** : thèse, logo, appel à l'action et tenue finale d'au moins 1,9 s.

### 4. Chorégraphie

- **Courbe signature** : `cubic-bezier(.16, 1, .3, 1)` pour les entrées, `(.65, 0, .35, 1)` pour la
  caméra et `(.7, 0, .84, 0)` pour les sorties.
- **Durées** : 180 ms (rapide), 320 ms (standard), 650 ms (lent), 900 ms (soulagement).
- **Dépassement de 6 à 12 %** (back-out ou ressort amorti), réservé aux éléments héros : statut
  « Active », lignes du tableau qui s'emboîtent (4 %), notification (12 %), bouton d'appel (10 %).
- **Décalages** de 50 à 70 ms, avec un total de moins de 500 ms par groupe. Les enfants suivent leur
  parent avec 60 à 100 ms de retard.
- **Aucune interpolation linéaire** pour un mouvement dans l'espace. Seule la frappe au clavier
  avance caractère par caractère.
- **Trois couches** : primaire (l'action de l'interface), secondaire (ombres, halos, effets de suite),
  ambiante (lumières menthe qui dérivent, grain).
- **Règle du tiers** : aucun déplacement de plus d'un tiers de l'écran sans clé intermédiaire. Les
  coups de fouet de la caméra suivent un arc.

---

## Scènes

Tempo musical de 120 BPM. Les frontières de scène tombent sur les temps (0,5 s).

| # | Temps | Durée | Ce qu'on voit | Caméra | Transition vers la suivante |
|---|---|---|---|---|---|
| 1 | 0,0–2,5 | 2,5 s | **Accroche.** Image 0 : une seule carte « Courtier 01 », en très grand. Neuf cartes apparaissent sur des croches pendant que l'odomètre roule de 1 à 10. On obtient une grille 2 × 5 qui remplit 83 % de la largeur (noms en 40 px), et chaque carte affiche sa ligne « Campagne Google Ads ». Titre : « **10 courtiers.** / 10 campagnes **Google Ads** ? » | Recul (dolly out) de 1,6× sur la carte 01 à 1,0× sur la grille, avec 1,5 % de dépassement. | **Smash zoom** : la caméra plonge dans la grille (1,0 → 1,8 en 0,25 s, flou de vitesse). On entre « dans » le chaos. |
| 2 | 2,5–5,5 | 3,0 s | **Chaos.** Cadre serré, des cartes coupées par les bords. Chaque campagne crache ses tâches, qui tombent et se chevauchent de plus en plus vite (220 ms → 60 ms entre deux) : « Ajuster le budget · Courtier 07 », « Nouvelle annonce · Courtier 02 », « Page de destination · Courtier 09 », « Mots-clés · Courtier 04 », « Rapport · Courtier 10 »… Un badge de notifications grimpe jusqu'à « 99+ ». Le titre change dans la même case, de plus en plus vite : « Plus de **courtiers**. » → « Plus de **campagnes**. » → « Plus de **gestion**. » | Trois secousses ou coups de fouet (< ⅓ d'écran, rotation de ± 3°, flou de vitesse), une à chaque changement de titre et de plus en plus rapprochées. La micro-secousse grandit. | **Implosion** : anticipation de 120 ms (tout gonfle de 3 %), puis tout est aspiré dans **un nœud vert** au centre (ease-in, 0,45 s, flou). Il ne reste que le nœud sur un fond vide. |
| 3 | 5,5–8,5 | 3,0 s | **Soulagement.** 0,3 s de silence : le nœud respire seul. Il éclot en panneau menthe, un disque qui remplit le cadre. La marque ScaleSuite apparaît par balayage, les lettres montent, puis le slogan « Google Ads pour l'immobilier québécois. » s'affiche. | Lente avancée de 1,00 à 1,04 (sinus). Aucune secousse. | **Élément partagé** : le logo rétrécit et vient se loger dans l'en-tête du tableau de bord, dont le corps se **déroule** vers le bas à partir de l'en-tête. |
| 4 | 8,5–11,0 | 2,5 s | **Une seule structure.** Tableau de bord de 900 px de large (83 %) : « ScaleSuite · Tableau de bord · Votre agence ». Dix lignes **s'emboîtent** une à une, avec 4 % de dépassement et un petit clic chacune : avatar, « Courtier 03 » (40 px), pastille « Vendeur · Lévis » (32 px) et « ● Active ». Chaque ligne a son type et son territoire, ce qui rend la personnalisation visible. Titre : « Une seule **structure**. » | Légère avancée pendant que les lignes se posent (1,00 → 1,06), puis poussée nette vers la ligne 03, qui reçoit un halo turquoise. Les autres lignes s'atténuent à 40 %. | **Morphose ligne → carte** : la ligne 03 s'ouvre et devient la carte de campagne, pendant que la caméra entre dedans. |
| 5 | 11,0–14,0 | 3,0 s | **Créées.** Carte « Campagne vendeur · Lévis » de 900 px, « Courtier 03 · Votre agence ». Les champs se remplissent : les squelettes deviennent des valeurs tapées (Type, Territoire, Page de destination). La miniature de la page se construit aux couleurs de l'agence, et l'annonce s'écrit. Un appui sur « Lancer la campagne » (pression de 3 % et onde) fait passer le statut de « Brouillon » gris à « **● Active** » vert, avec un dépassement de 10 % et une coche qui se dessine. Titre : « **Créées.** » (150 px) | Poussée sur la zone des champs (1,0 → 1,18), qui suit les champs de haut en bas, puis retour à 1,08 pour l'appui sur le bouton. | **Panoramique vertical continu** le long de la même carte jusqu'à sa section « Performance ». Le mot roule : « Créées. » → « Suivies. » |
| 6 | 14,0–16,0 | 2,0 s | **Suivies.** Trois tuiles de mesure (Impressions, Clics, Leads) dont les odomètres grimpent. Les chiffres font 72 px et les libellés 30 px. Une courbe de 900 px se trace de gauche à droite, et son point final saute avec 8 % de dépassement. Pastille « Suivi hebdomadaire ». | Zoom sur la tuile Leads au moment où elle prend +1 (1,0 → 1,12). | **Coup de fouet latéral** en arc vers le panneau « Optimisation » de la même carte. « Suivies. » → « **Optimisées.** » (en turquoise). |
| 7 | 16,0–18,0 | 2,0 s | **Optimisées.** Liste de mots-clés en 40 px : une barre grandit, un mot-clé faible est barré et glisse hors du cadre, un nouveau entre. Le titre de l'annonce se réécrit. Un message « Optimisation appliquée ✓ » saute avec 8 % de dépassement. Mention « Par notre IA et notre équipe. » | Poussée finale dans l'aperçu de l'annonce. | **Zoom à travers** : l'aperçu de l'annonce grandit et devient le résultat sponsorisé d'une recherche Google. La barre de recherche glisse au-dessus. |
| 8 | 18,0–25,0 | **7,0 s** | **LE LEAD, point culminant.** **a)** La barre de 900 px tape « vendre maison Lévis ». Le résultat sponsorisé est *l'annonce qu'on vient d'optimiser* ; un doigt appuie (onde). Titre : « Un **lead** entre. » **b)** La page de destination aux couleurs de l'agence monte depuis le résultat. Le formulaire se remplit, puis un appui sur « Envoyer » le **compresse en jeton « LEAD VENDEUR »** sombre (écrasement d'anticipation). **c)** La caméra suit le jeton, qui traverse le nœud ScaleSuite (anneau qui pulse), longe les 10 lignes du tableau de bord et **se verrouille sur Courtier 03** : la ligne s'allume et les autres s'atténuent. Gel de 80 ms. **d) Climax** : on traverse l'avatar de la ligne 03 jusqu'à **l'écran du téléphone de Courtier 03**. La notification tombe du haut avec 12 % de dépassement et une vibration (± 6 px, 3 oscillations) : « ScaleSuite · **Nouveau lead vendeur** · Lévis — Ajouté à votre CRM ✓ ». Titre : « Le **bon courtier** le reçoit. », tenu 1,2 s. | Suivi du jeton : fouet vers le bas sur un arc, avec flou de vitesse, puis poussée et zoom à travers sur la ligne 03. Le téléphone est cadré serré, partiellement coupé par le bas : on voit le détail, pas l'appareil en petit. | **Morphose** : la notification s'étire et s'amincit pour devenir la ligne de séparation de la thèse. Le téléphone tombe hors du cadre (ease-in). |
| 9 | 25,0–27,0 | 2,0 s | **Thèse.** « Plus de campagnes. » / ligne / « **Pas** plus de gestion. » (« Pas » tombe en place, comme un rappel de la scène 2). Une grille calme de nœuds de campagne, tous reliés à la ligne, montre l'ordre face au chaos. | Fixe, avec une dérive lente. | La ligne se contracte en un nœud, qui devient la marque. |
| 10 | 27,0–31,0 | 4,0 s | **Appel à l'action.** Logo complet (balayage de la marque, montée des lettres) et « Google Ads pour les équipes immobilières. ». Le bouton naît d'un nœud et s'étire en « **Demander une démo →** » avec 10 % de dépassement, puis « scalesuiteqc.ca ». Tout est posé à environ 29,0 s et tenu jusqu'à 31,0 s (reflet sur le bouton, petite impulsion de la flèche). | Avancée de 1 %. | Fin. |

Durées : 2,5 · 3,0 · 3,0 · 2,5 · 3,0 · 2,0 · 2,0 · **7,0** · 2,0 · 4,0 s. Les sous-temps internes
varient de 0,25 à 1,2 s.

---

## Ce qui change par rapport à la V2

| V2 | V3 |
|---|---|
| Tableau de bord à 56 % de la largeur, texte de l'interface de 19 à 29 px | Interface à au moins 70 % (cible 83 %), texte d'au moins 30 px (principal en 40 px), zooms de caméra |
| Les scènes s'enchaînent par des sorties en fondu ou en flou | Morphoses, poussées, panoramiques et zooms à travers, sans aucune scène semi-transparente |
| Tempo régulier, avec des pauses de lecture ajoutées après coup | Courbe dramatique : chaos qui accélère, vrai silence, montée, climax de 7 s |
| Textes posés sur des schémas | Interface qui réagit : campagne créée en direct, odomètres et courbe, mots-clés modifiés, notification de lead |
| Aucun rebond (« no bounce ») | Dépassement de 4 à 12 %, réservé aux éléments héros |
| Scène sombre au milieu | Fond clair tout du long. L'encre sombre est réservée au jeton du lead, pour qu'il saute aux yeux au climax |

## Contenu (vérifiable sur scalesuiteqc.ca/fr)

On conserve les affirmations de la V2 : tableau de bord centralisé, campagnes personnalisées par
courtier, pages de destination aux couleurs de l'agence, création, suivi et optimisation par l'IA
et l'équipe, leads livrés au CRM, et l'appel « Demander une démo ». Aucun prix, aucun superlatif,
aucun nom réel. Les courtiers restent « Courtier 01…10 ».

## Son (refait de zéro)

120 BPM, synthétisé en un seul morceau avec la même méthode que la V2 (numpy/scipy).

- **Chaos** : pulsation de doubles croches qui se densifie, pings de notification en grappe, souffle
  qui monte, coupés net à l'implosion (aspiration inversée vers le nœud).
- **Soulagement** : nappe chaude en majeur et cloche douce sur le logo.
- **Structure** : une note de marimba ascendante par ligne qui s'emboîte.
- **Produit** : groove propre. « Créées / Suivies / Optimisées » tombent sur les temps forts.
- **Lead** : montée et glissando qui suivent le jeton. Le **drop** tombe sur la notification.
- **Fin** : résolution sur la tonique.

Cible : −15 LUFS, −1,5 dBTP. Après validation, je produirai une feuille de timing pour la voix off,
comme pour la V2.

## Fichiers (rien de la V2 n'est modifié)

- `scalesuite-film/index-v3.html`, `src/core-v3.js`, `src/scenes-v3/*-v3.js` (les fichiers `core.js`
  et `logo.js` de la V2 sont chargés en lecture seule)
- `render/*-v3.mjs`, `audio/music-v3.py`, `build-v3.sh`
- Sorties : `brag-output/previews/*-v3.mp4`, `brag-output/scalesuite-social-9x16-v3.mp4`

## Étapes

1. Validation de ce plan.
2. Aperçu en basse résolution (540 × 960, 30 fps) des **scènes 1 à 3** (0 à 8,5 s), avec un premier
   jet de la musique sur ce segment.
3. Scènes 4 à 10, puis master en 1080 × 1920 à 60 fps.

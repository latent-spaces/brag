# ScaleSuite — "Plus de campagnes. Pas plus de gestion."

Social acquisition film · 27.5 s · 60 fps · muted-first · French (Québec)
Masters: **A** 1080×1920 (9:16: Reels, TikTok) and **B** 1080×1350 (4:5: LinkedIn feed),
rendered from one source with per-format recomposed layouts.

## One-sentence angle

A team leader watches their team grow from 1 to 10 brokers, and the Google Ads work multiplies
with it. Then all of it collapses into one ScaleSuite structure: campaigns stay personalized per
broker, get created, tracked and optimized for them, and each lead reaches the right broker.

**Backbone:** MORE BROKERS → MORE CAMPAIGNS → MORE MANAGEMENT ⟶ *ScaleSuite* ⟶ ONE STRUCTURE →
PERSONALIZED CAMPAIGNS → MANAGED FOR YOU.

## Primary viewer

A Québec team leader or agency director with 5–35 brokers. They must recognise their own problem
in 2 s: "Je n'ai pas le temps de superviser 10 comptes Google Ads" is a pain point quoted from
ScaleSuite's own site.

## Hook test (internal)

| | A: "10 courtiers. / 10 campagnes Google Ads ?" | B: "Votre équipe grandit. / La gestion Google Ads aussi." |
|---|---|---|
| Frame-0 clarity | A number + a broker card: concrete, real-estate-specific | Abstract; no real-estate cue in frame 0 |
| Category by 2 s | "Google Ads" lands at 1.1 s | "Google Ads" lands at ~1.5 s, second line |
| Motion engine | Counter rolls 1 → 10 as cards multiply (visual = text) | Needs separate visual metaphor |
| Mirrors site copy | Yes ("superviser 10 comptes Google Ads") | Partly |

**Decision: A.** B's idea is reused as the growth mechanic: the counter shows the team growing
without spending words on it.

## Copy verification (live site = source of truth, https://scalesuiteqc.ca/fr)

| On-screen idea | Site evidence |
|---|---|
| Google Ads for Québec real estate teams / agencies | Title: "Google Ads automatisé pour agences et courtiers immobiliers du Québec" |
| Several brokers, one centralized account/dashboard | "Un compte centralisé, plusieurs courtiers" · "Tableau de bord centralisé pour l'agence" |
| Campaigns personalized per broker or team | "Campagnes personnalisées par courtier ou par équipe" |
| Landing pages in the agency's colours | "Pages de destination aux couleurs de votre agence" · "Uniformité de marque garantie" |
| Created, tracked, optimized, by AI + team | "Notre IA et notre équipe s'occupent de la création, du suivi et de l'optimisation" |
| Official Google Ads API | "Vous connectez vos comptes Google Ads via l'API officielle" |
| Leads delivered to the CRM | "Les leads arrivent directement dans le CRM de votre choix" |
| CTA "Demander une démo" | Site CTA "Demander une démo agence" (agency path) |

**Deliberately excluded:** "La première plateforme…" and "La meilleure solution…" (unsupported
superlatives), all prices, the free trial, lead/ROI numbers, and any "Recrutement" campaign type
(not on the live site). Brokers are "Courtier 01…10"; there are no names, faces or contact data.

## Visual system

- **Palette:** off-white `#F7FBFA` / pale mint `#E8F9F7` (~75 %), ink `#1A1A1A` / `#2C2C2A`
  (~18 %), turquoise `#2BBFB3` + green `#1D9E75` accents (~7 %). One dark stage (S6) in
  `#141716 → #1A1A1A` with turquoise light.
- **Type:** Inter (the site's font), 800 weight, −3.5 % tracking for headlines; 600 for UI.
  Headlines are 104–132 px on the 1080-wide canvas, 2–7 words each.
- **Logo:** the site's public logo, vectorised (potrace) for crisp hero sizes; per-letter reveal.
- **Motif A, routing line:** 3 px turquoise path, drawn by stroke-dashoffset, carrying a light dot.
- **Motif B, node:** 14–22 px green `#1D9E75` dot with a mint halo.
- **Motif C, mint panel:** a rounded mint surface that expands into a scene or shrinks into a card.
- **Motion:** expo/quint ease-outs (fast in, long settle), 50–90 ms staggers, masked vertical
  reveals, odometer counters, speed-scaled blur on fast moves. No bounce, no elastic.

## Timeline (120 BPM, 1 bar = 2 s, scene boundaries on beats)

| # | Time | Scene | On-screen copy | Visual action (object-caused transition) |
|---|---|---|---|---|
| 1 | 0.0–2.5 | **Scroll stopper** | "**1 → 10** courtiers." then "10 campagnes **Google Ads** ?" | One broker card at frame 0; cards pop in on 8th-notes while an odometer rolls 1→10; at 1.1 s each card fires a routing line to its own "Campagne Google Ads" chip |
| 2 | 2.5–5.0 | **Problem expands** | "Plus de **courtiers**." → "Plus de **campagnes**." → "Plus de **gestion**." | Every campaign chip sprouts Ciblage / Page de destination / Optimisation / Lead tags; lines cross; camera slowly pushes in; density builds (art-directed, not ugly) |
| 3 | 5.0–7.5 | **The reset** | "ScaleSuite" · "Google Ads pour l'immobilier québécois." | Everything is pulled into one green node (speed blur); the node blooms into a mint panel; the mark wipes in, letters rise; first calm moment |
| 4 | 7.5–11.0 | **Centralization** | "Toute votre équipe / sur **Google Ads**." → "Une seule structure." | The logo shrinks into the header of a central dashboard card; 5 broker nodes pop around it; turquoise lines draw in; pulses flow into the hub; rows fill in ("Courtier 01 · Campagne vendeur · Active") |
| 5 | 11.0–14.5 | **Personalization at scale** | "Centralisé." → "Mais **personnalisé**." | A dashboard row lifts out and becomes one campaign card; it duplicates into 4 cards; fields roll to "Vendeur · Lévis", "Acheteur · Québec", "Vendeur · Rive-Sud", "Acheteur · Beauce"; every landing thumbnail keeps the same agency colours |
| 6 | 14.5–18.0 | **Managed (dark hero)** | "Créées." / "Suivies." / "**Optimisées.**" (stacking list) + "Par notre IA et notre équipe." | Cards collapse into one; the dark panel expands from behind it; layered depth cards; the check chips draw one at a time: Campagne créée ✓ · Suivi hebdomadaire ✓ · Mots-clés optimisés ✓ · Annonce mise à jour ✓; small "API Google Ads officielle" badge |
| 7 | 18.0–21.5 | **The lead** | "Un lead entre." → "Le **bon courtier** le reçoit." | The dark stage contracts into a search bar; query types "vendre maison Lévis"; a sponsored result appears; a tap turns it into a "LEAD VENDEUR" pill; the pill rides one continuous route: Google Ads → ScaleSuite → Courtier 03 (highlighted among dimmed peers) → CRM ✓ |
| 8 | 21.5–24.0 | **Thesis** | "Plus de campagnes." / "**Pas** plus de gestion." | The route line straightens into the divider between two huge lines; a calm grid of campaign nodes is all wired to one line (order vs. S2's chaos). "Pas" pushes in front of S2's "plus de gestion" as a typographic callback |
| 9 | 24.0–27.5 | **CTA / brand** | ScaleSuite · "Google Ads pour les équipes immobilières." · **Demander une démo →** · scalesuiteqc.ca | The nodes slide into one aligned row, compress into the mark; the wordmark rises; the line becomes the CTA underline; the button fills turquoise; everything is settled by 25.6 s and held 1.9 s |

Every readable line stays fully settled for ≥ 0.3 s per word, counted from when the whole line is
in (checked in the preview pass).

## Safe areas and recomposition

- **9:16 (1080×1920):** headline block y ≈ 250–600; visual cluster y ≈ 650–1480; nothing critical
  below 1500 (captions/UI) or above 220; right rail x > 940 kept free of copy between y 850–1550.
- **4:5 (1080×1350):** headline block y ≈ 110–400; visual cluster y ≈ 440–1260; 60 px margins.
- Layouts are separate position tables per format. Examples: the S1 broker grid is 2 × 5
  horizontal cards (9:16) vs. 5 × 2 vertical tiles (4:5); the S7 route runs vertically (9:16) vs.
  horizontally (4:5); headline sizes are 124 px vs. 104 px. Nothing is cropped or stretched.

## Sound (secondary; film is complete muted)

120 BPM, F major / D minor colour, all synthesised as one piece: a soft kick, offbeat ticks, a
round sub, a pluck arpeggio and a warm pad, sharing one reverb space. Card pops are quiet in-key
plucks under the groove. S2 filters open and a riser builds into S3, where the mix drops to a pad
+ sub bloom for the logo. The groove returns in S4–S5. S6 is darker and low-passed. S7 brightens,
with a glide as the lead travels and a soft chime in the CRM. S8 strips back to pad + pulse. S9
resolves on the tonic and rings out. Target −15 LUFS integrated, −1.5 dBTP.

## Poster

The settled hook frame ("10 courtiers." + "10 campagnes Google Ads ?" + full grid) is exported as
`scalesuite-preview.jpg` and baked in as frame 0 of both masters for platform thumbnails.

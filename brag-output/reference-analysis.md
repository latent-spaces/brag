# Reference analysis — ScaleSuite social film

Method: `ffprobe` for format data; `ffmpeg select='gte(scene,0)'` + `metadata=print` for per-frame
change scores (hard-cut detection and a "motion energy" curve); timestamped frame sheets at 2 fps
for every reference, plus 6–10 fps strips across each major transition; `ebur128` for loudness.
Working files: `brag-output/work/ref/`.

## File → role mapping (important)

The file numbers in the repo do not match the roles in the brief. I mapped them **by content**:

| Brief role | Repo file | What it actually is |
|---|---|---|
| **REFERENCE 01** — cinematic SaaS storytelling (filmed off a screen) | `video refenrce 3.mp4` | "CraftedStays" SaaS film playing inside After Effects, filmed with a phone |
| **REFERENCE 02** — NeuraFlow | `Video refenrece 2.mp4` | NeuraFlow dark product film |
| **REFERENCE 03** — LangEase | `video refenrece 1.mp4` | LangEase light kinetic film |

---

## REFERENCE 01 — CraftedStays (cinematic SaaS storytelling)

**1. Duration / format.** 53.2 s, 720×1280, 30 fps, AAC stereo. The inner film (landscape, ~16:9)
occupies roughly 640×370 px of the frame; the rest is the laptop, After Effects UI, keyboard and a
caption ("Imagine this is your company Saas video"). **Only the inner film was analysed as the
creative reference.** The phone, laptop, desk, reflections, moiré and camera shake are ignored.

**2. Major scenes (inner film).**

| Time | Beat |
|---|---|
| 0.0–3.5 | Pink haze clears into a cinematic landscape; headline split around the subject: "Your properties … deserve more." |
| 3.5–5.5 | Same image becomes a website hero inside a monitor mock-up ("BOOK A TRIP") |
| 5.5–9.2 | Gradient wipe → redesigned site in monitor; avatars, chat bubbles, emoji float around it |
| 9.2–10.5 | Full-frame brand geometry (concentric rings from the logo) as a graphic transition |
| 10.5–12.0 | "Meet CraftedStays" + logo, **brand reveal at ~20 % of runtime**, not at the start |
| 12.0–16.3 | "The e-commerce platform / behind direct booking sites"; a real UI button ("Book a trip") + cursor clicks *inside* the sentence |
| 16.3–18.7 | "Connect your PMS": a dot on the word draws a line into the logo node (**a routing-line motif**) |
| 18.7–21.0 | Listings UI rises; green status chips |
| 21.2–30.0 | Analysis beat over imagery → personas → forecast card → report UI → "Your strategic playbook in 15 minutes" |
| 30.0–40.5 | AI assistant UI: tabs, typed prompt, conversation, landing page updates live |
| 40.5–43.8 | Kinetic statement scrolling horizontally with motion blur: "Discovery is changing faster than most properties can keep up." |
| 43.8–48.5 | Outcome: "Booked" chips stacking beside the product |
| 48.5–50.5 | Benefit triad on soft colour blobs: "More direct bookings / More control / Less work" |
| 50.5–53.0 | Ring pattern collapses into the logo + URL (~1.5 s hold) |

**3. Transitions.** Scene-score detection finds **no hard cuts in the inner film**; every change is
a morph. The image becomes a website, the website becomes a gradient, the gradient becomes brand
geometry, a word emits a line that becomes a connection, and a UI card becomes the next background.
Big graphic "wipes" made from the brand shape (rings) mark act changes.

**4. Typography.** Clean grotesk (Inter/Aeonik-like), medium weight, sentence case, tight tracking.
Statements run at about 8–12 % of frame height. Colour-gradient text is used for emphasis. Phrases
are split across beats, so one sentence is spread over 2–3 shots.

**5. Motion.** Slow, continuous camera drift on images; UI rises in with soft ease-out. The kinetic
statement uses horizontal motion blur. A cursor provides "the product is being used" moments.

**6. Scene duration.** 1.5–3.5 s per beat; the brand reveal holds ~1.5 s.

**7. UI treatment.** Real product UI, simplified and enlarged: one card or one list at a time,
white glass cards with soft shadows over gradient fields. UI never fills the frame edge to edge.

**8. Depth.** Monitor mock-up at a slight angle, floating tags/avatars at different depths,
background blur on gradient fields. Depth is mild and editorial rather than 3D-heavy.

**9. Colour.** A single brand gradient system (pink → magenta → violet → coral) on off-white. The
dark tones come only from photography.

**10. Composition.** Centre-weighted. Headline and UI share the frame and are often interlocked:
the button sits inside the headline, and the line leaves a word. There is generous negative space.

**11. Hook.** Cinematic image + half a sentence ("Your properties …") creates an open loop. On
TikTok the *caption* is the real hook (curiosity framing), because the inner film opens slowly.

**12. Ending / CTA.** A brand-geometry graphic resolves into logo + URL. No button, one action.

**13. Visual change frequency.** Motion-energy peaks every ~1–2 s; nothing is static for longer
than ~2 s.

**14. Text per screen.** 2–6 words, usually one phrase fragment.

**15. Attention.** It alternates **image → product → typography → brand**, and every scene
starts from an object left over from the last one.

**16/17. What translates to social.** Sentence fragments across beats; a routing line from a word
to a node; UI embedded inside typography; the benefit triad; brand geometry as the transition
device. It does *not* translate as-is: 53 s is too long, the text is small for a phone, and the
opening is slow.

---

## REFERENCE 02 — NeuraFlow (premium depth / hero product)

**1. Duration / format.** 20.1 s, 1920×1080, 30 fps. Loud, continuous music bed (−9.8 LUFS, LRA 1).

**2. Major scenes.**

| Time | Beat |
|---|---|
| 0.0–1.0 | Logo in a volumetric light beam above a glowing horizon arc |
| 1.0–3.8 | Arc rises; dashboard emerges from beneath it; title "Smart Control / Customized Dashboard"; glass cards float at the sides |
| 4.0–6.8 | Camera pulls back; the dashboard shrinks in front of giant ghosted wordmark; content state changes (charts) |
| 7.0–8.8 | Flash transition → "New Updates" orb with orbiting feature icons |
| 9.1–12.6 | Flash → chat interaction: query types, AI reply card expands |
| 12.6–16.2 | Feature cards arranged on a rotating 3D cylinder |
| 16.2–17.2 | The cylinder morphs into the 4-point brand star (magenta rim light) |
| 17.2–20.1 | Logo lockup + "Discover NeuraFlow today" under the beam (~2.8 s hold) |

**3. Transitions.** Two flash cuts (7.07 s, 9.13 s; scene score ≈ 0.2). Everything else is
emergence: interfaces rise out of light, shrink into a larger system, or morph into the logo.

**4. Typography.** Small, bold title + light subtitle, top-centre, with a giant low-contrast
ghost wordmark as a background texture.

**5. Motion.** Slow, weighted camera moves: dolly back, orbit and rise. Motion is always eased
and never bouncy. Glow pulses are subtle.

**6. Scene duration.** 2–3.6 s, which is slower than social pacing.

**7. UI treatment.** Glassmorphism panels, thin 1 px luminous borders, soft inner glow, blurred
background cards. The dashboard content is secondary to its staging.

**8. Depth.** The strongest of the three references: foreground and background cards, depth-of-field
blur, volumetric beam, horizon light, 3D carousel.

**9. Colour.** Near-black navy, electric blue, a touch of magenta. **Do not copy.**

**10. Composition.** Symmetrical and centred, with the hero object in the lower two-thirds and the
light source above.

**11. Hook.** Logo first. That is premium, but weak for a feed: nothing tells a stranger why to care.

**12. Ending.** Morph → mark → lockup with one line. Very high perceived quality.

**13. Visual change frequency.** A meaningful change every ~1.5–2.5 s. The frame is never fully
still because of the drifting light and parallax.

**14. Text per screen.** 2–5 words.

**15. Attention.** Spectacle and continuous camera motion rather than message.

**16/17. What translates to social.** One dark "hero product" beat as a pattern interrupt; layered
cards with depth-of-field; an interface emerging from a light source; a logo reveal that grows out
of an object from the film.

---

## REFERENCE 03 — LangEase (social pacing, kinetic type, light)

**1. Duration / format.** 33.1 s, 640×360 (landscape), 30 fps. Music −13.8 LUFS.

**2. Major scenes.**

| Time | Beat |
|---|---|
| 0.0–3.0 | Word swaps: "Turn" → "Turn Books" → "Audio" → "Any" → "Any language" (0.5–0.8 s per state) |
| 3.0–4.3 | "Any language [folder icon] Instantly": an **inline product object between words** |
| 4.3–6.0 | Folder opens → document card → blur-out |
| 6.0–9.8 | "Just drop and go" / "Books. Audio. Video" / "All In One Platform" inside a 3D phone tunnel |
| 9.8–11.0 | Phone whips; its edge becomes a blue ribbon that becomes a progress bar |
| 11.0–12.6 | Score counts 63 → 100/100 |
| 12.8–14.2 | "Done" + check + confetti |
| 14.3–17.7 | Card row → 3D-tilted library UI → cursor click → card zooms |
| 17.7–20.0 | Card whips and multiplies into floating cards: "Multiple Languages" |
| 20.0–24.3 | Dashboard list → row → "Distribute To Youtube" button click |
| 24.3–28.5 | Sparkle star flies and draws a path; "Translate. Dub. Distribute" builds word by word |
| 28.5–33.1 | Star → logo mark → "LangEase" → URL (4.5 s hold) |

**3. Transitions.** Only one hard cut in 33 s (23.3 s). **Every transition is an object that
causes the next scene**: phone → ribbon → progress bar, card → many cards, button → star → logo.
Fast whips use strong motion blur.

**4. Typography.** Inter-like, regular/medium (not bold), two-tone (a light-blue word + a dark
word), and words that blur-to-sharp with a small scale settle. Words are small in frame (~5–7 % of
height), which is too small for a phone feed.

**5. Motion.** Snappy ease-out (fast in, long settle), stagger 60–100 ms, 3D tilts on cards,
cursor clicks with a press state, and counting numbers.

**6. Scene duration.** 0.5–1.5 s per state; visual state changes ~every 0.6 s (median).

**7. UI treatment.** Real UI fragments (a card, a button, a row) enlarged and isolated on a light
background, with a soft blue glow under objects.

**8. Depth.** Mid: 3D-tilted phones and cards, drop shadows and motion blur, but the background
stays flat.

**9. Colour.** Pale lavender-white base, one blue→violet accent gradient, dark text. **The
blue/purple is not to be copied.**

**10. Composition.** Centre-locked. One object and one phrase per frame.

**11. Hook.** Motion from frame 0 (a word is already animating). The first 3 s give the promise in
3 words.

**12. Ending / CTA.** Logo built from the film's recurring object (the star), then URL. One action.

**13. Visual change frequency.** Motion-energy never flat for more than ~1 s until the logo hold.

**14. Text per screen.** 1–3 words.

**15. Attention.** Constant object continuity, counting numbers, click moments, "Done" reward
beats, and three-word rhythmic triads.

**16/17. What translates to social.** Almost everything, except the small text size and the
consumer-app softness: word replacement, triads, object-driven transitions, counters, click moments,
the reward beat, and a logo built from a recurring motif.

---

## Audio across references

All three carry a **continuous music bed** from frame 0 to the end (−14 to −10 LUFS), with visual
transitions landing on beats. None uses voice-over. This justifies a subtle, rhythmic bed for
ScaleSuite. The film must still work muted, so every idea is carried visually.

---

## WHAT TO APPLY TO SCALESUITE

1. **Object-caused transitions (Ref 03 + Ref 01).** Broker cards → campaign cards → tangled web →
   collapse into one node → the node becomes the logo → the logo becomes the dashboard hub → a
   dashboard row becomes a campaign card → the card duplicates → the stack becomes the dark product
   stage → the stage contracts to a search result → the lead's route line becomes the thesis
   divider → the nodes align into the end lockup. No fades to black.
2. **Kinetic word replacement with a fixed anchor (Ref 03).** "Plus de **courtiers**. →
   **campagnes**. → **gestion**." One word changes at a time, so each state reads in under 0.5 s.
3. **A counter as the hook engine (Ref 03's 63 → 100).** "1 courtier" rolls to "10 courtiers"
   as the cards multiply, which communicates team growth without a sentence.
4. **Routing line + node (Ref 01's "Connect your PMS").** A thin turquoise line and a green node,
   reused as broker ↔ campaign, campaign ↔ ScaleSuite, and lead → broker → CRM.
5. **Alternate product / typography / brand (Ref 01).** Brand reveal at ~20 % of runtime, right
   after the problem, never at frame 0.
6. **One dark hero beat (Ref 02).** A single premium dark stage for "Créées. Suivies.
   Optimisées." with layered, depth-blurred campaign cards, a soft turquoise light from above, and
   a controlled camera. It is the mid-film pattern interrupt, then the film returns to light.
7. **Emergence (Ref 02).** Interfaces grow out of the node and the mint panel instead of sliding
   in.
8. **Reward beats (Ref 03's "Done").** Check-mark chips drawing themselves; the lead arriving in
   the CRM.
9. **Benefit statement moment (Ref 01's triad / statement).** "Plus de campagnes. Pas plus de
   gestion." in large type with almost no UI.
10. **Logo built from the recurring motif (Ref 03 + Ref 02).** The nodes used all film long align
    and resolve into the lockup.
11. **Pacing.** A visual change every 0.5–1.5 s, scene boundaries on a 120 BPM grid (2 s bars).
12. **Two-tone emphasis.** Dark text with the key word in turquoise ("Google Ads",
    "personnalisé", "bon courtier").

## WHAT NOT TO APPLY TO SCALESUITE

- The phone-filmed monitor, laptop, desk, After Effects UI, keyboard, reflections, moiré and camera
  shake of Ref 01. Only its inner film was used.
- The pink/magenta gradients (Ref 01), the navy/electric-blue/neon palette (Ref 02) and the
  blue/violet identity (Ref 03). ScaleSuite stays pale mint / off-white / dark ink / turquoise.
- Logo-first openings (Ref 02) and slow cinematic openings (Ref 01). ScaleSuite opens on the
  problem.
- Small, light-weight text (Ref 03, Ref 01). The phone feed needs heavy, large, high-contrast type.
- Sci-fi orbs, glowing cylinders, 4-point AI sparkles and heavy glassmorphism (Ref 02). They read
  as "AI startup", and the brief says AI is supporting technology, not the message.
- Consumer-app confetti and playful bounces (Ref 03). Rewards stay restrained: a drawn check and a
  soft pulse.
- Fake metrics shown in the references (forecast numbers, "100/100", report figures). ScaleSuite
  shows **states** (created, tracked, optimized, lead received), never numbers.
- Stock imagery, lifestyle photography and houses. Software stays at the centre.
- Long runtime (Ref 01: 53 s). Target 27.5 s.

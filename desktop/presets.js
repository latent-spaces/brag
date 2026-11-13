// Preset library for brag-desktop. Single source of truth: the UI renders it (GET /api/presets)
// and the server turns the chosen preset into the prompt handed to /brag (presetBlock).
//
// Rules every preset obeys (they come from the /brag skill's own creative laws):
//  - 10-25s, hook first, specific to the project, show the real product, no generic SaaS language.
//  - Nothing invented: stats, quotes and claims must exist in the project. Beats with nothing real to show are merged or dropped.

export const TONES = ['default', 'polished', 'yc-parody', 'chaotic', 'deadpan', 'cinematic', 'app-store'];
export const FORMATS = ['landscape', 'vertical', 'square'];

export const CATEGORIES = [
  { id: 'launch', name: 'Launch' },
  { id: 'ads', name: 'Ads' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'onboarding', name: 'Onboarding' },
  { id: 'demo', name: 'Demo' },
  { id: 'creative', name: 'Creative' },
];

// beat(start, end, name, note)
const beat = (s, e, name, note) => ({ s, e, name, note });
const music = { music: true, sfx: true, voice: false };

// `sample`: id of a real /brag output shipped in public/samples (null = storyboard preview only).
export const PRESETS = [
  {
    id: 'playful-launch', category: 'launch', name: 'Playful Launch',
    tagline: 'Warm, funny and shareable. The good-vibes default.',
    summary: 'A friendly launch video: a relatable hook, the product revealed, the real UI doing its main job, then a clear call to action.',
    bestFor: 'Consumer apps and side projects with personality',
    tone: 'default', format: 'landscape', duration: 22, audio: music, sample: 'horse-tinder',
    beats: [
      beat(0, 3, 'Hook', 'A relatable line or observation that sets up the product'),
      beat(3, 6, 'Reveal', 'Product name and one-line promise at full size'),
      beat(6, 12, 'In use', 'The real UI doing its main thing: entry, key action, result'),
      beat(12, 16, 'Highlights', 'Two short feature cards, one idea each'),
      beat(16, 20, 'Proof', 'A real number, quote or result from your project (dropped if none exists)'),
      beat(20, 22, 'Call to action', 'Name, tagline and where to get it'),
    ],
    expect: ['Bright, bouncy motion with soft crossfades and clean slides', 'Your project’s own colors, fonts and UI are reused, not redrawn', 'Upbeat music with light sound effects on the cuts'],
    needs: 'A UI or site with one clear main action',
    rules: ['Warm first-person-plural voice; no corporate language', 'One idea per scene'],
  },
  {
    id: 'premium-launch', category: 'launch', name: 'Premium Launch',
    tagline: 'Slow reveals and restraint, for products that should feel expensive.',
    summary: 'An elegant, restrained launch: few scenes, long holds, one feature per scene, and a confident outro.',
    bestFor: 'Serious products, design tools, anything described as “clean” or “elegant”',
    tone: 'polished', format: 'landscape', duration: 20, audio: music, sample: null,
    beats: [
      beat(0, 5, 'Hook', 'The product name or one strong image at full scale'),
      beat(5, 10, 'Feature one', 'A single capability shown on the real UI, with room to breathe'),
      beat(10, 15, 'Feature two', 'A second capability, no bullets or lists'),
      beat(15, 20, 'Outro', 'Name, tagline, then silence'),
    ],
    expect: ['Slow crossfades (about 0.6–0.8s) and generous empty space', 'Light, widely spaced type; nothing aggressive', 'Soft music with very little sound-effect noise'],
    needs: 'Good-looking real screens or visuals',
    rules: ['Third person or no voice; the product speaks for itself', 'No lists, no exclamation marks'],
  },
  {
    id: 'deadpan-launch', category: 'launch', name: 'Deadpan Startup Launch',
    tagline: 'A parody-serious launch where each scene makes one claim.',
    summary: 'A fake-serious startup launch: the problem stated seriously, one claim per scene, a metric, then the name and a URL that implies legitimacy.',
    bestFor: 'Absurd or recursive concepts that work best played straight',
    tone: 'yc-parody', format: 'landscape', duration: 22, audio: music, sample: 'taxi-for-taxis',
    beats: [
      beat(0, 4, 'The problem', 'Stated completely seriously, no winking'),
      beat(4, 8, 'Claim one', 'A feature or fact stated as fact'),
      beat(8, 13, 'Claim two', 'The real UI or flow that backs it up'),
      beat(13, 18, 'Metric', 'A number from the project, in monospaced type'),
      beat(18, 22, 'Name and URL', 'Product name, tagline and a link'),
    ],
    expect: ['Hard cuts or very short crossfades', 'Heavy sentence-case type with monospaced data points', 'Dry delivery: the joke is how seriously it is played'],
    needs: 'A concept with an inherent joke, and real numbers if you want a metric beat',
    rules: ['Serious, matter-of-fact tone with no winking', 'Every metric must come from the project'],
  },
  {
    id: 'feature-spotlight', category: 'launch', name: 'Feature Spotlight',
    tagline: 'One new feature, shown working. Short enough to post anywhere.',
    summary: 'A tight spotlight on a single feature: name it, show it on the real UI, state the benefit, say where to find it.',
    bestFor: 'Feature drops, product updates, a single capability you want noticed',
    tone: 'app-store', format: 'landscape', duration: 14, audio: music, sample: null,
    beats: [
      beat(0, 3, 'Name it', 'Feature name and a one-line promise'),
      beat(3, 8, 'Show it', 'The real UI performing the feature end to end'),
      beat(8, 11, 'Benefit', 'One line on what changes for the user'),
      beat(11, 14, 'Where to find it', 'Available now, plus the path or link'),
    ],
    expect: ['Clean feature-card layout with smooth slides (about 0.4s)', 'Short and focused: one idea only', 'Tell the agent which feature in the extra direction box, or it picks the strongest one'],
    needs: 'Mention the feature name in “Custom tone or creative direction”',
    rules: ['Cover exactly one feature', 'Show the feature working before describing it'],
  },
  {
    id: 'social-ad', category: 'ads', name: 'Social Ad (9:16)',
    tagline: 'Vertical hook-first ad for Reels, TikTok and Shorts.',
    summary: 'A vertical short-form ad built around the first two seconds: a pattern-interrupting hook, the problem, the product as the fix, one proof point and a call to action.',
    bestFor: 'Paid social, short-form feeds, anything watched with the sound off',
    tone: 'default', format: 'vertical', duration: 15, audio: music, sample: null,
    beats: [
      beat(0, 2, 'Hook', 'A pattern-interrupting line or visual that stops the scroll'),
      beat(2, 5, 'Problem', 'The pain, in one plain sentence'),
      beat(5, 10, 'Solution', 'The product fixing it, large and readable on a phone'),
      beat(10, 13, 'Proof', 'One real result, number or claim from the project'),
      beat(13, 15, 'Call to action', 'What to do next, in big type'),
    ],
    expect: ['9:16 frame with large type that reads with the sound off', 'The first two seconds carry the hook; no logo-first intros', 'Fast but readable: each line holds long enough to read'],
    needs: 'A clear problem the product solves, and screens that look good tall',
    rules: ['Text sized for a phone screen and readable with sound off', 'No logo or brand intro before the hook'],
  },
  {
    id: 'problem-solution-ad', category: 'ads', name: 'Problem → Solution Ad',
    tagline: 'State the pain, turn the corner, demo, benefits, CTA.',
    summary: 'A classic direct-response structure: name the pain, introduce the product as the turn, demonstrate it, list two benefits and close with a call to action.',
    bestFor: 'Landing-page video, search or display ads, B2B products',
    tone: 'app-store', format: 'landscape', duration: 18, audio: music, sample: null,
    beats: [
      beat(0, 4, 'Pain', 'The problem your audience recognises, in their words'),
      beat(4, 7, 'The turn', 'Product name appears as the answer'),
      beat(7, 13, 'Demo', 'The real UI solving the problem step by step'),
      beat(13, 16, 'Benefits', 'Two benefits as feature cards'),
      beat(16, 18, 'Call to action', 'Clear next step and URL'),
    ],
    expect: ['Clean, professional feature-card look', 'The problem is named before the product appears', 'Ends on a concrete action, not a slogan'],
    needs: 'README or site copy that states who it is for and what it fixes',
    rules: ['Use the project’s own wording for the pain', 'Benefits come from real copy, not generic claims'],
  },
  {
    id: 'hero-loop', category: 'marketing', name: 'Landing Hero Loop',
    tagline: 'A silent, looping clip for the top of your website.',
    summary: 'A short, calm, silent clip designed to autoplay muted behind or beside a landing-page hero, ending where it began so it loops.',
    bestFor: 'Homepage heroes, product pages, embeds that autoplay muted',
    tone: 'polished', format: 'landscape', duration: 12, audio: { music: false, sfx: false, voice: false }, sample: null,
    beats: [
      beat(0, 3, 'Settle', 'The product’s strongest single visual, held steady'),
      beat(3, 6, 'Feature A', 'A key interaction, shown once'),
      beat(6, 9, 'Feature B', 'A second interaction'),
      beat(9, 12, 'Return', 'Eases back to the opening frame so the loop is seamless'),
    ],
    expect: ['No audio, so it is safe to autoplay muted', 'Slow, low-key motion that does not fight your page copy', 'Delivered as an MP4 (not a GIF); embed with autoplay, muted, loop, playsinline'],
    needs: 'A visually strong product screen',
    rules: ['No text that must be read quickly; the page carries the copy', 'The final frame should match the first for a clean loop'],
  },
  {
    id: 'founder-story', category: 'marketing', name: 'Why We Built It',
    tagline: 'A narrated, human explanation of the idea behind the product.',
    summary: 'A voiceover-led story: the itch that started it, what was tried, what was built, why it is different, and an invitation.',
    bestFor: 'About pages, launch posts, investor or community updates',
    tone: 'polished', format: 'landscape', duration: 25, audio: { music: true, sfx: false, voice: true }, sample: null,
    beats: [
      beat(0, 4, 'The itch', 'The problem that made this worth building'),
      beat(4, 10, 'What we tried', 'The old way, and why it fell short'),
      beat(10, 17, 'What we built', 'The product, shown in use while the narration explains'),
      beat(17, 22, 'Why it is different', 'The one thing that sets it apart'),
      beat(22, 25, 'Invitation', 'A warm, specific call to try it'),
    ],
    expect: ['Narration by Kokoro (a text-to-speech voice), mixed under soft music', 'Uses the full Hyperframes workflow, so it takes longer than silent presets', 'First-person narration written from your README and about copy'],
    needs: 'README or about copy that explains the motivation',
    rules: ['Use only motivations stated in the project; if none are stated, write about the product’s purpose instead of inventing an origin story', 'Narration complements the visuals and never just reads on-screen text'],
  },
  {
    id: 'onboarding-3-steps', category: 'onboarding', name: 'Onboarding in 3 Steps',
    tagline: 'Welcome new users and walk them to their first win.',
    summary: 'A first-run walkthrough: a welcome, three real steps from sign-up to first result, and a “you’re set” finish.',
    bestFor: 'Welcome emails, in-app first-run, help-center intros',
    tone: 'app-store', format: 'landscape', duration: 22, audio: music, sample: null,
    beats: [
      beat(0, 3, 'Welcome', 'Product name and what the user is about to do'),
      beat(3, 8, 'Step 1', 'The first real action, with a short caption'),
      beat(8, 13, 'Step 2', 'The next real action'),
      beat(13, 18, 'Step 3', 'The action that produces the first result'),
      beat(18, 22, 'You’re set', 'The result, and where to go next'),
    ],
    expect: ['Numbered steps with one short caption each', 'Cursor clicks and typing on the real UI', 'Friendly and calm, never salesy'],
    needs: 'A flow with a clear first-run path (routes or components the agent can read)',
    rules: ['The three steps must follow the app’s real flow', 'Captions start with a verb'],
  },
  {
    id: 'whats-new', category: 'onboarding', name: 'What’s New',
    tagline: 'A release-notes video: version, three changes, try it.',
    summary: 'A short release announcement: the headline of the release, up to three real changes shown on the UI, and a prompt to update or try it.',
    bestFor: 'Changelogs, release posts, existing users who need to hear what changed',
    tone: 'app-store', format: 'landscape', duration: 15, audio: music, sample: null,
    beats: [
      beat(0, 3, 'Headline', 'Version or release name and the one-line theme'),
      beat(3, 6, 'Change one', 'The most important change, shown on the real UI'),
      beat(6, 9, 'Change two', 'The next change'),
      beat(9, 12, 'Change three', 'A third change, or a fix people asked for'),
      beat(12, 15, 'Update now', 'Where to get it or how to try it'),
    ],
    expect: ['Feature-card rhythm with clean slides', 'Built from your changelog or recent commit messages', 'Name the release in the extra direction box to focus it'],
    needs: 'A CHANGELOG or readable recent commits (or tell the agent which release)',
    rules: ['Only describe changes that actually exist in the changelog or commits', 'Show each change on the UI before describing it'],
  },
  {
    id: 'how-it-works', category: 'demo', name: 'How It Works',
    tagline: 'Three clear steps from problem to result, for people who are new.',
    summary: 'An explainer for prospects: the promise, three captioned steps showing the real product, and a call to action.',
    bestFor: 'Homepages, sales decks, social posts that need to explain the product fast',
    tone: 'app-store', format: 'landscape', duration: 25, audio: music, sample: null,
    beats: [
      beat(0, 3, 'Promise', 'What the product does for whom, in one line'),
      beat(3, 9, 'Step one', 'The input or starting point on the real UI'),
      beat(9, 15, 'Step two', 'What the product does with it'),
      beat(15, 21, 'Step three', 'The result the user gets'),
      beat(21, 25, 'Call to action', 'How to start'),
    ],
    expect: ['Each step has an action-verb caption', 'A stranger should understand what it does after one viewing', 'Calm pacing with room to read'],
    needs: 'A product with a clear input, process and result',
    rules: ['Lead with what it does, not how it is built', 'Each step is a real action in the product'],
  },
  {
    id: 'dev-tool-demo', category: 'demo', name: 'Developer Tool Demo',
    tagline: 'Terminal-first: the real command, the real output, the result.',
    summary: 'A demo for command-line or developer tools: the pain in one line, the actual command, the actual output, the result, and the install line.',
    bestFor: 'CLIs, libraries, APIs and dev-tool launches',
    tone: 'polished', format: 'landscape', duration: 20, audio: music, sample: null,
    beats: [
      beat(0, 3, 'The pain', 'The annoying thing, in one line'),
      beat(3, 9, 'Run it', 'The real command typed out in a monospaced terminal'),
      beat(9, 14, 'Output', 'The real output, with the key line highlighted'),
      beat(14, 18, 'Result', 'What you have now that you did not before'),
      beat(18, 20, 'Install', 'The install or import line'),
    ],
    expect: ['Monospaced type, a terminal-style frame and typing animation', 'Commands and output are taken from your README or code, never made up', 'Restrained and technical rather than flashy'],
    needs: 'A README with real usage examples',
    rules: ['Use real commands, flags and output from the project; never invent CLI output', 'Keep terminal text large enough to read'],
  },
  {
    id: 'website-tour', category: 'demo', name: 'Website Tour',
    tagline: 'A guided scroll through your real site: hero, sections, numbers, CTA.',
    summary: 'A tour that animates your actual site: the hero, key sections, a numbers block, the people behind it, a quote, and the call to action.',
    bestFor: 'Products whose site already tells the story well',
    tone: 'polished', format: 'landscape', duration: 22, audio: music, sample: 'fish-flight-school',
    beats: [
      beat(0, 4, 'Hero', 'The hero as visitors first see it, animated in'),
      beat(4, 10, 'Key sections', 'Scrolls through the main sections using your real markup'),
      beat(10, 13, 'Numbers', 'A stats block, only if your site has real figures'),
      beat(13, 16, 'The people', 'A team, founder or instructor card if one exists'),
      beat(16, 19, 'Quote', 'A real testimonial or pull-quote from the site'),
      beat(19, 22, 'Call to action', 'The main button and link'),
    ],
    expect: ['Your real site markup, colors and fonts, animated rather than panned screenshots', 'Sections that do not exist on your site are skipped', 'Tone setting changes the type and pacing; the sample shows the structure'],
    needs: 'A finished site or landing page in the project',
    rules: ['Reuse the site’s real markup and assets', 'Skip any beat the site has no real content for'],
  },
  {
    id: 'epic-trailer', category: 'creative', name: 'Epic Trailer',
    tagline: 'Treat your project like a summer blockbuster.',
    summary: 'A trailer-scale video: a sweeping statement, capabilities presented as superpowers, an escalation, and a full-screen title.',
    bestFor: 'Projects with an epic angle, big scale or grand claims',
    tone: 'cinematic', format: 'landscape', duration: 22, audio: music, sample: null,
    beats: [
      beat(0, 4, 'The world', 'A sweeping, serious statement about the problem'),
      beat(4, 9, 'Superpowers', 'Capabilities stated like powers, each on its own beat'),
      beat(9, 14, 'Escalation', 'Bigger claims on bigger visuals'),
      beat(14, 18, 'The product', 'The real UI, dramatically revealed'),
      beat(18, 22, 'Title', 'The name slams in full-screen, then the tagline'),
    ],
    expect: ['Big type, full-bleed scenes, dramatic wipes and slow scale-ins', 'Short declarative sentences that each land before the next', 'Music built to swell into the title'],
    needs: 'A project that can carry big, bold language',
    rules: ['Epic language, but every capability named must be real', 'Never more than one idea per beat'],
  },
  {
    id: 'museum-exhibit', category: 'creative', name: 'Museum Exhibit',
    tagline: 'Your project as a hushed gallery piece, with placards.',
    summary: 'A deadpan museum treatment: entrance, exhibits with catalogue-number placards, a curator’s note and a gift-shop call to action.',
    bestFor: 'Quirky projects where restraint makes the joke land harder',
    tone: 'deadpan', format: 'landscape', duration: 20, audio: music, sample: null,
    beats: [
      beat(0, 4, 'Entrance', 'A quiet title card, as on a gallery wall'),
      beat(4, 9, 'Exhibit A', 'A real feature shown with a catalogue-style placard'),
      beat(9, 14, 'Exhibit B', 'A second feature, same placard style'),
      beat(14, 17, 'Curator’s note', 'A dry one-line observation about the project'),
      beat(17, 20, 'Gift shop', 'Where to get it, deadpan'),
    ],
    expect: ['Calm music, long holds, a lot of empty space', 'Placard typography: catalogue numbers, small captions', 'Dry humor from restraint rather than jokes'],
    needs: 'Features worth displaying one at a time',
    rules: ['Direction: museum exhibit, hushed and dry, with placards and catalogue numbers', 'Humor comes from the project, never from forced jokes'],
  },
];

// Free-text direction some presets add on top of the structure (kept short; the user's own direction is appended after it).
const DIRECTION = {
  'museum-exhibit': 'Creative direction: a museum exhibit.',
  'dev-tool-demo': 'Creative direction: terminal-first, monospaced.',
  'hero-loop': 'Creative direction: a seamless silent loop for a website hero.',
};

export const byId = id => PRESETS.find(p => p.id === id) || null;

const fmtT = (s, e) => `${s}–${e}s`;
export function presetBlock(p) {
  const lines = [
    `Video type: ${p.name}. ${p.summary}`,
    `Use this beat structure as the plan's storyboard, adapting it to the project's real content (times are targets; total about ${p.duration}s):`,
    ...p.beats.map((b, i) => `${i + 1}. ${fmtT(b.s, b.e)} ${b.name}: ${b.note}`),
    'Type rules:',
    ...p.rules.map(r => `- ${r}`),
    '- Use only copy, claims, numbers and quotes that exist in the project. If a beat has nothing real to show, merge it with a neighbour or drop it instead of inventing material.',
  ];
  if (DIRECTION[p.id]) lines.push(DIRECTION[p.id]);
  return lines.join('\n');
}

// Self-check used by test-presets.mjs
export function validatePresets(presets = PRESETS) {
  const errs = [], seen = new Set();
  for (const p of presets) {
    const at = `preset ${p.id}`;
    if (seen.has(p.id)) errs.push(`${at}: duplicate id`); seen.add(p.id);
    if (!/^[a-z0-9-]+$/.test(p.id)) errs.push(`${at}: bad id`);
    if (!CATEGORIES.some(c => c.id === p.category)) errs.push(`${at}: unknown category ${p.category}`);
    if (!TONES.includes(p.tone)) errs.push(`${at}: unknown tone ${p.tone}`);
    if (!FORMATS.includes(p.format)) errs.push(`${at}: unknown format ${p.format}`);
    if (!(p.duration >= 10 && p.duration <= 40)) errs.push(`${at}: duration ${p.duration} outside the form's 10–40s range`);
    if (!p.beats?.length) errs.push(`${at}: no beats`);
    let t = 0;
    for (const b of p.beats || []) { if (b.s !== t) errs.push(`${at}: beat "${b.name}" starts at ${b.s}, expected ${t}`); if (b.e <= b.s) errs.push(`${at}: beat "${b.name}" has no length`); t = b.e; }
    if (t !== p.duration) errs.push(`${at}: beats end at ${t}s but duration is ${p.duration}s`);
    for (const k of ['name', 'tagline', 'summary', 'bestFor', 'needs']) if (!p[k]) errs.push(`${at}: missing ${k}`);
    if (!p.expect?.length || !p.rules?.length) errs.push(`${at}: missing expect/rules`);
    if (p.audio?.voice && p.audio.music === undefined) errs.push(`${at}: audio incomplete`);
  }
  return errs;
}

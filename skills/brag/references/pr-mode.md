# PR mode: brag about a change, not the whole product

Active whenever the invocation contains `--pr`. In this mode `/brag` makes a demo
video of **one feature as it was actually shipped** — the change in a pull request —
instead of a launch video for the whole project.

The audience is different too. A normal brag is for X/LinkedIn/Discord. A PR brag is
usually for the people who did not read the diff: product managers, design, support,
leadership, the rest of the team. They want to see the feature work, not the code.

Everything in `SKILL.md` still applies — short, readable, specific, show the thing.
This file covers what changes.

**Not `pr-to-video`.** Hyperframes ships its own PR workflow. `/brag --pr` does not
route into it, exactly as `/brag` does not route into `product-launch-video`. The
boundary is unchanged: `/brag` owns the angle, the creative laws, the storyboard and
the copy; the Hyperframes domain skills (`hyperframes-core`, `-animation`, `-creative`,
`-keyframes`, `-cli`) own the composition and the render.

---

## Parsing `--pr`

| Form | Example | Meaning |
|---|---|---|
| Number | `--pr 42` | PR #42 in the current repo |
| URL | `--pr https://github.com/org/repo/pull/42` | That PR, any repo |
| List | `--pr 42,43,47` | One video covering all three (see "Multi-PR bundles") |
| Bare | `--pr` | The PR for the current branch (`gh pr view` with no argument) |

`--pr` composes with every other flag: `--tone`, `--format`, `--duration`, `--voice`,
`--no-music`, `--no-sfx`, `--title`.

Related flag:

| Option | Values | Default |
|---|---|---|
| `--base` | branch or SHA to diff against | the PR's own base branch |

`--base` matters for stacked PRs and for the no-`gh` fallback. Don't ask for it; only
use it when the user passes it or when the base is genuinely ambiguous.

---

## Step 0: Gather the PR context

Do this before reading any project files. Write everything you learn to
`<output-dir>/pr-context.md` — it is the source material for the whole run, the way
`index.html` is in a normal brag.

### Resolve which repo the PR lives in (do this first)

A bare number is ambiguous. In a **fork**, `gh pr view 42` resolves against the fork —
which usually has no PRs — and fails with `Could not resolve to a PullRequest`. That is
the common case for contributors, so handle it up front:

```bash
git remote -v          # is there an upstream/ as well as an origin/?
```

Then address the PR unambiguously, in this order of preference:

1. **The URL the user gave** — `gh pr view https://github.com/org/repo/pull/42`. Works
   from any directory, fork or not, with no default repo configured. Prefer this.
2. **`--repo owner/name`** on every `gh` call, taken from the remote that actually
   hosts the PR (`upstream` when the clone is a fork, `origin` otherwise).
3. **Bare** — only when the clone is not a fork.

If the user gave a bare number in a fork, resolve it against the upstream remote and
say which repo you used. Don't run `gh repo set-default` — that writes to the user's
git config for every future command, not just this run.

Everywhere below, `<pr>` means "the PR URL, or the number plus its `--repo` flag".

### With the GitHub CLI (preferred)

```bash
gh pr view <pr> --json number,title,body,author,url,state,isDraft,baseRefName,headRefName,baseRefOid,headRefOid,isCrossRepository,additions,deletions,changedFiles,labels,files,commits
gh pr diff <pr> --name-only
gh pr diff <pr>
```

Linked issues give you the "why" in the requester's own words:

```bash
gh pr view <pr> --json closingIssuesReferences
```

Review comments often name the real user-facing behavior better than the PR body does:

```bash
gh pr view <pr> --comments
```

### Getting the changed files without disturbing the working tree

You need to *read* the code at the PR's head, and the same files at base. Don't switch
the user's branch to do it — fetch the head into a local ref and read blobs out of it.

Fetch from the remote that hosts the PR (`upstream` in a fork, `origin` otherwise —
`isCrossRepository` and the remotes tell you which):

```bash
git fetch <remote> pull/<number>/head:brag-pr-<number>
git fetch <remote> <base-branch>
```

The *before* state is the merge base — where the PR diverged — not the current tip of
the base branch, which may have moved on:

```bash
BASE=$(git merge-base <remote>/<base-branch> brag-pr-<number>)

git show brag-pr-<number>:path/to/file.tsx   # after
git show "${BASE}:path/to/file.tsx"          # before
```

Brace the variable. In zsh — the macOS default shell — `"$BASE:examples/..."` is read as
a history modifier and silently eats the first character of the path
(`unknown revision or path not in the working tree`). `"${BASE}:path"` is safe in both
shells.

If the merge base can't be computed (shallow clone, base branch not fetched), fall back
to the PR's `baseRefOid`.

Delete the temp ref when the run is over:

```bash
git branch -D brag-pr-<number>
```

`gh pr checkout <pr>` is fine too, but it mutates the working tree — only run it if
the tree is clean **and** the user agrees, and offer to switch back when the run ends.

### Without `gh` (or offline)

Fall back to plain git. This also covers GitLab, Bitbucket, and local-only branches:

```bash
git fetch <remote> <head-branch>
git diff --stat <base>...<head>
git diff <base>...<head>
git log --oneline <base>..<head>
```

The three-dot form is deliberate: it diffs against the merge base, so unrelated commits
that landed on the base branch since the PR opened don't show up as part of the change.

Use `--base` if the user gave one, otherwise the repo's default branch. Say in
`pr-context.md` that the metadata came from git alone — PR title and description
weren't available, so the video's framing leans on commit messages and the diff.

If neither `gh` nor a fetchable remote works, stop and tell the user what you need
(auth with `gh auth login`, or a branch name to diff). Don't invent the change.

### Big diffs

A 4,000-line diff will not fit and does not need to. Read the stat first, then pick
the files that carry the user-visible change:

```bash
git diff --stat <base>...<head>
```

Skip lockfiles, snapshots, generated clients, migrations, and vendored directories.
Read the 5–10 files that a user would actually feel, in full, at both base and head.
Note in `pr-context.md` which parts of the diff you deliberately ignored.

### What `pr-context.md` must contain

```markdown
# PR Context: #[number] — [title]

- Repo: [org/repo — note if resolved via upstream from a fork]
- Author: [handle]        State: [open / draft / merged]
- Base → head: [base] → [head]
- Size: +[additions] / -[deletions] across [n] files
- URL: [link]
- Metadata source: [gh / git-only]

## What the PR says it does
[PR description, condensed. Quote the line that states the user-facing intent.]

## Linked issue / request
[The problem someone asked for, in their words. Or "none linked".]

## The user-visible change
[One paragraph. What a person using the product can now do that they couldn't before.
If the change is invisible to end users, say who does see it — an engineer, an admin,
an on-call responder — and what they see.]

## Before → after
- Before: [the old behavior, as read from the base-branch files]
- After: [the new behavior, as read from the head files]

## Files that carry the change
- [path] — [what it does in this change]
- [path] — [...]

## Deliberately ignored
- [lockfiles / tests / generated code / unrelated refactor in the same PR]

## Change class
[ui-surface / new-flow / behavior-behind-ui / non-visual] — see pr-mode.md
```

**Gate:** `<output-dir>/pr-context.md` exists and its "user-visible change" paragraph
is specific enough that a PM who never opened the PR would understand the feature.

---

## Scoped inspection

Step 1 still runs, but it is scoped. You are not inspecting the product — you are
inspecting the change plus exactly enough of its surroundings to render it honestly.

Read, in this order:

1. **The changed files at head**, in full. Not just the diff hunks — the diff tells you
   what moved, the whole file tells you what the screen looks like.
2. **The same files at base**, for the parts that changed. This is how you get the
   *before* right instead of guessing at it.
3. **The parents of the changed components** — the page, route, or layout that renders
   them. The feature has to appear in its real context, not floating on a blank canvas.
4. **The project's visual identity** — colors, fonts, and the design tokens from
   `styles.css` or equivalent, exactly as step 1 describes. The demo must look like the
   product, so this part is never skipped even in PR mode.
5. **Tests and fixtures touched by the PR** — the fastest source of realistic sample
   data. Use their values instead of inventing lorem content.

Do not read the marketing site, the README's feature list, or unrelated routes unless
the PR touched them. A PR brag that drifts into a product overview has failed.

---

## The PR rubric

Replaces the 9-question rubric from step 1. Answer all nine before planning.

```
1. What changed?
   One sentence, in product language. Not "refactored the reducer" —
   "filters now survive a page reload."

2. What could someone not do before?
   The missing capability, stated as the user experienced it.

3. What is the before state, concretely?
   The exact old screen, message, number, or step — read from the base branch,
   not imagined. This is half the video.

4. What is the after state, concretely?
   The exact new screen, message, number, or step.

5. What is the single clearest moment of proof?
   The one beat where a viewer goes "oh, that's better." Usually the cut from
   before to after, sometimes the result of the new action.

6. Who asked for this, and what did it cost them?
   From the linked issue, PR body, or review thread. Names the stakes in one line.
   "Support was hand-editing these" beats "improves efficiency."

7. What tone fits?
   Default to `changelog` in PR mode — plain, benefit-first, stakeholder-readable.
   Override only if the user asked for a tone or the change is genuinely funny.

8. What must the video NOT claim?
   List anything adjacent that this PR did not do. Guards against overselling.

9. What is the change class?
   ui-surface — a screen, component, or visual the user sees directly.
   new-flow — a sequence of steps the user now moves through.
   behavior-behind-ui — the screen looks the same; it behaves better
     (faster, correct, no longer loses data).
   non-visual — API, CLI, infra, schema, job. Nothing on screen changes.
```

---

## Choosing what to show: the before/after law

**In PR mode, the centerpiece is the difference.** A video that only shows the new
state is a feature ad; a video that shows both states is a demo. Show both.

Preferred, in order:

1. **Before → after on the same frame.** Recreate the old screen, hold it long enough
   to register the pain, then cut or morph to the new one. Same layout, same position,
   same crop — only the changed thing moves. Side-by-side works too, but the cut is
   stronger because the viewer's eye is already in the right place.
2. **The new flow, end to end.** For `new-flow` changes: entry → the new action →
   result, with the old friction stated in one line of text at the top instead of shown.
3. **The mechanism, made visible.** For `behavior-behind-ui`: the screen stays put and
   you animate what actually changed — the spinner that no longer appears, the value
   that now persists through a reload, the count that used to be wrong.
4. **The interface that does exist.** For `non-visual`: see below.

Whatever you pick, use the product's real palette, real fonts, and real copy strings
from the changed files. The demo should be indistinguishable from a screen recording
of the branch.

---

## Non-visual PRs

Every PR has *a* surface, it just isn't always a screen. Find the real one and show it
honestly rather than dressing a backend change up as a UI change.

| Change | Show |
|---|---|
| API endpoint | The request and the response, as formatted JSON, typing in |
| CLI | The terminal — command typed, real output, real exit state |
| Performance | The number, measured: the before timing and the after timing |
| Bug fix | The failing case reproduced, then the same case passing |
| Schema / data | The row or payload, old shape beside new shape |
| Infra / CI | The pipeline view or log output, red → green |

Two rules. Use real strings from the diff — actual field names, actual flags, actual
error text. And never fabricate a benchmark: if the PR does not state a measured
number and you cannot produce one, show the mechanism instead of a metric.

If the change is genuinely undemonstrable — a dependency bump, a pure internal
refactor — say so plainly and offer the alternatives: a normal `/brag` on the project,
or a different PR. Don't manufacture a demo out of nothing.

### Worked example: a PR with no UI at all

A docs-and-convention PR titled *"Pin one Hyperframes CLI version per run"*, +7/-1
across three markdown files. Nothing renders. It still has a surface:

```
Change class: non-visual (CLI behavior + convention)

Before: every command in the run is a bare `npx hyperframes …`, so each one
        resolves whatever is newest on npm at that moment — the CLI can change
        mid-run.
After:  the version is resolved once with `npx hyperframes@latest --version`,
        then every command uses `npx hyperframes@<version> …`.

What to show: the terminal. Four commands scroll past, each tagged with a
        different resolved version — then the same four, all pinned to one.
        Real command names from the diff: check, snapshot, preview, render.
Proof moment: the version column going from mixed to identical.
Must not claim: faster renders, fewer bugs, reproducible output across
        machines. The diff pins a version. It does not measure anything.
```

That is a real demo of a real change, and every frame of it is in the diff.

---

## Storyboard pattern

Replaces the default `Hook → Reveal → highlights → Punchline` shape.

```
The problem (2-4s) → Before (2-4s) → After / the new flow (6-10s) → What it unlocks (2-4s)
```

Total still lands in 15–25 seconds. The before→after cut is the hook; place it inside
the first 6 seconds.

Scene-by-scene intent:

- **The problem.** One line, in the requester's terms. "Filters reset every time you
  refreshed." Not a feature name.
- **Before.** The old state, real and unflattering. Hold it long enough to feel wrong —
  about a second past comfortable. This scene earns the next one.
- **After / the new flow.** The centerpiece, and the longest stretch. Show the actual
  interaction: the click, the reload, the typed input, the returned result. Simulate
  the gesture; don't cut to a finished state.
- **What it unlocks.** The consequence for the person who asked, plus the PR reference
  (`#42`, or the title). One line each.

Keep the reading-time floor from `step-2-plan.md` — short label ~0.8s settled, a
sentence ~0.3s per word. Before/after cuts are fast; the text around them is not.

---

## The honesty rule

A PR brag is shown to people who make decisions based on it. It carries one extra law,
and it outranks every creative instinct in this skill:

**Only claim what the diff does.**

- No capability that isn't in the changed code.
- No invented metrics, timings, or adoption numbers.
- No "coming soon" framed as shipped.
- If the PR is open and unmerged, the video says so — a small `#42 · in review`
  marker in the outro is enough.
- If part of the feature is behind a flag, the video says which part.

When you catch yourself writing a line the diff doesn't support, cut the line. The
video is shorter and still true.

---

## Multi-PR bundles

`--pr 42,43,47` makes **one** video, not three. Gather context for each PR, then find
the thread that connects them and write a single plan around it.

- Lead with the shared outcome, not the PR count. "Saved views" beats "3 PRs shipped."
- Give each PR one beat inside the same before→after arc. Three beats is the
  comfortable ceiling for a 20-second video.
- If the PRs genuinely have nothing in common, say so and offer two options: pick the
  strongest one, or make separate videos. Don't force a theme that isn't there.
- Reference all of them in the outro (`#42 · #43 · #47`) and list them in
  `pr-context.md` under one combined "user-visible change".

---

## Output directory

PR runs get their own directory so they never collide with a project brag:

```
brag-output-pr-42/                  # single PR
brag-output-pr-42-43-47/            # bundle
brag-output-pr-42-2026-05-04-143022/  # if the above already exists
```

Same contents as a normal run, plus `pr-context.md`.

---

## Delivery differences

The video, poster, and share copy are produced exactly as `step-4-deliver.md`
describes. Two things change.

**Share copy is internal by default.** `share-copy.txt` is written for the place this
actually gets posted — a PR comment, a Slack channel, a sprint review. Plain language,
the outcome first, the PR link last. Keep it to the same one-to-three sentences.

```
Filters now survive a page reload — pick your view once and it's still there tomorrow.
Shipped in #42.
```

If the user wants the public version too, write it to `share-copy-variants.md`.

**Offer to post it, don't post it.** Attaching the video to the PR is an outward-facing
action with an audience. Ask first, every time — even if you posted to a PR earlier in
the session.

```bash
gh pr comment <pr> --body-file <output-dir>/share-copy.txt
```

GitHub comments can't take a local file as a video attachment from the CLI, so tell the
user to drag `brag.mp4` into the comment box, or post the copy and let them attach the
file. Never claim the video was uploaded when only the text was.

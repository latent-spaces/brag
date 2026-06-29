# Playwright CLI browser inspection

Use `playwright-cli` to open the project in a real browser, navigate through pages, take screenshots, and capture structured snapshots. This reveals the actual rendered UI, interactive elements, animations, and user flows — giving you richer material for the brag video than static files alone.

Screenshots taken during inspection double as visual references for the Hyperframes composition.

## Setup

Ensure `playwright-cli` is installed and has a browser available:

```bash
# Install the CLI
npm install -g @playwright/cli@latest

# Install a browser (required for first use)
playwright-cli install-browser chromium
```

If not available globally, use `npx playwright-cli` instead.

### Browser options

Use `--browser=chromium` to use the installed Playwright Chromium (no system Chrome needed). This is the most portable option and works on any system including CI/headless environments:

```bash
playwright-cli open http://localhost:3000 --browser=chromium
```

Without `--browser`, it will attempt to use your system's installed Google Chrome. If Chrome is not installed, use `--browser=chromium` or install Chrome first.

## Starting a browser session

Open the project's URL in a browser. You can specify the URL explicitly or auto-detect:

```bash
# Open with explicit URL from --url option
playwright-cli open http://localhost:3000 --browser=chromium

# Headless mode (no visible window, faster — default)
playwright-cli open http://localhost:3000 --browser=chromium
```

If the project has no running dev server, start one:
- Check `package.json` for `dev`, `start`, or `serve` scripts
- Common commands: `npm run dev`, `python3 -m http.server`, `npx serve`

### Viewport

```bash
# Set viewport size (default 1280x720)
playwright-cli resize 1920 1080
```

Always use at least 1280x720 or larger for representative screenshots.

## Inspecting pages

Navigate through the project's pages and take snapshots/screenshots of each key page:

```bash
# Navigate to a page
playwright-cli goto http://localhost:3000

# Take a structured snapshot (YAML with element refs, accessible tree)
playwright-cli snapshot --filename=<output-dir>/screenshots/homepage-snapshot.yaml

# Take a visual screenshot (PNG)
playwright-cli screenshot --filename=<output-dir>/screenshots/homepage.png

# Snapshot with bounding boxes (useful for layout analysis)
playwright-cli snapshot --boxes --filename=<output-dir>/screenshots/homepage-boxes.yaml
```

### What to capture

Visit and screenshot every distinct page/section:

1. **Homepage / landing** — hero, headline, CTA, nav
2. **Feature pages** — each feature section, product cards
3. **User flow pages** — signup, dashboard, results, editor
4. **Testimonials / social proof** — quotes, stats, case studies
5. **Pricing / about** — if present

```bash
# Example: capture the full homepage
playwright-cli goto http://localhost:3000
playwright-cli screenshot --filename=<output-dir>/screenshots/01-homepage.png
playwright-cli snapshot --boxes --filename=<output-dir>/screenshots/01-homepage-snapshot.yaml

# If the page has scrolling content, capture below the fold
playwright-cli eval "window.scrollTo(0, document.body.scrollHeight)"
sleep 1
playwright-cli screenshot --filename=<output-dir>/screenshots/01-homepage-bottom.png
```

## Discovering UI elements

Use snapshots to understand the page structure and find interactive elements:

```bash
# Get a full snapshot with element refs (e15, e22, etc.)
playwright-cli snapshot

# Interact with elements by their ref to explore flows
playwright-cli click e5     # click the CTA button
playwright-cli snapshot     # see what happens after click

# Evaluate page content
playwright-cli eval "document.title"
playwright-cli eval "document.querySelector('h1').textContent"
```

## Capturing user flows

To understand the product in action, simulate a user flow:

```bash
# Step through a signup flow
playwright-cli goto http://localhost:3000/signup
playwright-cli screenshot --filename=<output-dir>/screenshots/02-signup.png
playwright-cli fill e1 "user@example.com"
playwright-cli fill e2 "password123"
playwright-cli click e3
sleep 1
playwright-cli screenshot --filename=<output-dir>/screenshots/03-signup-result.png
```

## Extracting colors and fonts

Beyond static CSS analysis, playwright-cli can extract computed styles from the rendered page:

```bash
# Extract the page's computed background color
playwright-cli eval "getComputedStyle(document.body).backgroundColor"

# Extract font families in use
playwright-cli eval "getComputedStyle(document.body).fontFamily"

# Extract primary heading font
playwright-cli eval "getComputedStyle(document.querySelector('h1')).fontFamily"

# Extract accent color from primary button
playwright-cli eval "getComputedStyle(document.querySelector('button')).backgroundColor"
```

## Organizing output

Save all screenshots to `brag-output/screenshots/`:

```bash
mkdir -p <output-dir>/screenshots
```

These screenshots serve as:
- **Visual reference** for the Hyperframes composition — tell Hyperframes to recreate specific UI elements
- **Color/font extraction** — computed styles from the live page
- **Layout reference** — understand what the actual product looks like

## When to skip Playwright

Skip browser inspection when:
- The project has no runnable frontend (library, CLI tool, backend-only)
- The project requires complex auth/setup to render
- The user passed `--no-browser`
- The dev server fails to start

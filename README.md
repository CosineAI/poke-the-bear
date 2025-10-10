# Generic Static Site Template

A minimal, no-build static site template — just open `index.html` and start editing.

## About This Game

This repository is a lightweight scaffold for a simple browser game. It runs entirely client‑side (no backend, no build step).

- Entry point: `index.html`
- Styles: `assets/style.css`
- Script/game logic: `assets/script.js`

Run locally:
- Double-click `index.html`, or
- Serve the folder with a static server (for example):
  - Python: `python3 -m http.server 8000` then open http://localhost:8000

## Game Rules

Use this default rule set as a starting point. Adjust it to match your final mechanics.

- Objective: Earn points by achieving in‑game goals while avoiding hazards.
- Controls:
  - Desktop: Arrow keys or WASD to move; Space to jump/action; P to pause; R to restart.
  - Mobile: Tap or on‑screen controls if implemented.
- Scoring: Collectibles/items increase your score. Collisions with hazards reduce health/lives.
- End conditions: The game ends when you lose all lives/health or when the timer (if enabled) reaches zero.
- Progression: Difficulty can scale over time or with score (tweak in `assets/script.js`).

## Project Rules (Development)

- Branching: `feature/*`, `fix/*`, `docs/*` from `main`. Keep PRs small and focused.
- Commits: Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`).
- Code style:
  - HTML: semantic structure; one `h1` per page; descriptive `alt` text.
  - CSS: mobile-first; low specificity; prefer CSS custom properties.
  - JS: vanilla and modular; avoid globals; feature‑detect APIs.
- Accessibility: Keep keyboard navigability and visible focus; maintain WCAG AA contrast; do not rely on color alone.
- Performance: Optimize images; defer/non‑blocking scripts; avoid unnecessary libraries.
- SEO/Metadata: Unique title and meta description; logical heading hierarchy; Open Graph/Twitter tags when applicable.
- Assets/Licensing: Use only assets you have rights to; credit sources where required.
- Reviews: One approval required; resolve all comments; squash merge.

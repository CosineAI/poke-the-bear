# Poke the Bear

A lightweight, no-build party game you can run locally in any modern browser.

Players take turns poking a sleeping bear. Each poke increases the chance the bear wakes up. If you wake the bear, you lose.

## How to run

1. Clone/download this repo.
2. Open `index.html` in your browser.

No install step, no build step.

## How to play

1. Choose **Number of Players** (2–12).
2. Optionally enter player names.
3. Click **Start Game**.
4. On your turn:
   - Click **Poke the Bear** at least once.
   - Optionally use **Sing a Lullaby** once per player per game to reduce the current risk.
   - Click **End Turn** to pass play.

## Settings

Use **Settings** (bottom-right) to adjust:

- **Initial Probability**: starting wake chance.
- **Poke Increment**: how much the wake chance increases after each poke.

Settings lock once the game starts.

## Project structure

- `index.html` — the game UI
- `assets/style.css` — styling
- `assets/script.js` — game logic

## Notes

- Player count and names are saved in `localStorage` for convenience.

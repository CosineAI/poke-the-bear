# Fireplace — Terminal TUI

A Go CLI/TUI that renders a cozy, animated fireplace in your terminal. It uses a lightweight flame simulation and 256‑color ANSI styling for a visually appealing look.

## Controls
- `q` / `esc` / `ctrl+c`: Quit
- `space`: Pause/Resume
- `+` / `-`: Increase/Decrease flame intensity

## Build and Run
```bash
go mod tidy
go build -o fireplace
./fireplace
```

Tip: Run in a modern terminal with 256‑color support and sufficient window size for best visuals.

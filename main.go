package main

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

type spark struct {
	x int
	y int
	vy float64
	life int
}

type model struct {
	w int
	h int
	paused bool
	intensity float64
	grid [][]float64
	sparks []spark
	lastTick time.Time
}

// initGrid creates a new flame grid with decay initialized to zero
func (m *model) initGrid() {
	m.grid = make([][]float64, m.h)
	for y := range m.grid {
		m.grid[y] = make([]float64, m.w)
	}
}

// seedBottom adds random heat at the bottom row to fuel the flame
func (m *model) seedBottom() {
	if m.h == 0 || m.w == 0 {
		return
	}
	for x := 0; x < m.w; x++ {
		// flicker with some randomness, stronger near the center
		center := float64(m.w-1) / 2.0
		dist := (float64(x) - center) / center
		atten := 1.0 - 0.6*dist*dist
		heat := m.intensity * atten * (0.7 + 0.6*rand.Float64())
		m.grid[m.h-1][x] = clamp(m.grid[m.h-1][x]+heat, 0, 1.25)
	}
}

// step advances the flame simulation upward with diffusion and decay
func (m *model) step() {
	if m.paused || m.w == 0 || m.h == 0 {
		return
	}

	m.seedBottom()

	// rise and diffuse
	for y := 0; y < m.h-1; y++ {
		for x := 0; x < m.w; x++ {
			// sample from below and neighbors
			var below float64 = m.grid[y+1][x]
			var left float64 = m.grid[y+1][max(0, x-1)]
			var right float64 = m.grid[y+1][min(m.w-1, x+1)]
			val := (below*0.55 + left*0.225 + right*0.225)
			// decay per step
			decay := 0.015 + 0.02*rand.Float64()
			m.grid[y][x] = clamp(val-decay, 0, 1.25)
		}
	}

	// decay top row slightly
	for x := 0; x < m.w; x++ {
		m.grid[0][x] = clamp(m.grid[0][x]-0.02, 0, 1.25)
	}

	// occasionally spawn sparks
	if rand.Float64() < 0.35 {
		s := spark{
			x: rand.Intn(m.w),
			y: m.h - 2 - rand.Intn(3),
			vy: -(0.6 + 0.6*rand.Float64()),
			life: 12 + rand.Intn(20),
		}
		m.sparks = append(m.sparks, s)
	}

	// update sparks
	next := m.sparks[:0]
	for _, s := range m.sparks {
		s.life--
		if s.life <= 0 {
			continue
		}
		// vertical movement
		s.y += int(s.vy)
		// slight sideways drift
		if rand.Float64() < 0.5 {
			if rand.Float64() < 0.5 {
				s.x++
			} else {
				s.x--
			}
		}
		if s.x < 0 || s.x >= m.w || s.y < 0 {
			continue
		}
		next = append(next, s)
	}
	m.sparks = next
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func initialModel() model {
	return model{
		w: 0,
		h: 0,
		paused: false,
		intensity: 0.45,
		lastTick: time.Now(),
	}
}

func (m model) Init() tea.Cmd {
	return tea.Tick(time.Second/30, func(time.Time) tea.Msg { return tickMsg{} })
}

type tickMsg struct{}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tickMsg:
		m.step()
		return m, tea.Tick(time.Second/30, func(time.Time) tea.Msg { return tickMsg{} })

	case tea.WindowSizeMsg:
		// reserve a few rows for header and base logs
		w := msg.Width
		h := msg.Height
		if w < 20 {
			w = 20
		}
		if h < 12 {
			h = 12
		}
		m.w = w
		m.h = h - 6 // header + base area
		if m.h < 6 {
			m.h = 6
		}
		m.initGrid()
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc", "ctrl+c":
			return m, tea.Quit
		case " ":
			m.paused = !m.paused
		case "+":
			m.intensity = clamp(m.intensity+0.05, 0.2, 1.0)
		case "-":
			m.intensity = clamp(m.intensity-0.05, 0.2, 1.0)
		}
		return m, nil
	}

	return m, nil
}

func (m model) View() string {
	var b strings.Builder

	// header
	title := styleBold(gradient(" Fireplace ", 196, 214, 226))
	controls := dim(" q/esc: quit  space: pause  +/-: intensity ")
	separator := dim(strings.Repeat("─", max(10, m.w)))
	b.WriteString(title)
	b.WriteString("\n")
	b.WriteString(controls)
	b.WriteString("\n")
	b.WriteString(separator)
	b.WriteString("\n")

	// render flame area
	for y := 0; y < m.h; y++ {
		for x := 0; x < m.w; x++ {
			v := m.grid[y][x]
			ch := intensityChar(v)
			col := intensityColor(v)
			b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", col, ch))
		}
		if y < m.h-1 {
			b.WriteString("\n")
		}
	}

	// base: logs + embers
	b.WriteString("\n")
	logs := renderLogs(m.w)
	b.WriteString(logs)

	// overlay sparks
	// We simply append a line with sparse rising sparks to give a sense of motion above logs
	b.WriteString("\n")
	b.WriteString(renderSparks(m.w, m.sparks))

	return b.String()
}

// intensityColor maps heat intensity to 256-color palette codes
func intensityColor(v float64) int {
	// clamp and scale
	v = clamp(v, 0, 1.1)
	switch {
	case v < 0.15:
		return 52  // dark red
	case v < 0.30:
		return 88
	case v < 0.45:
		return 124
	case v < 0.60:
		return 160
	case v < 0.70:
		return 166
	case v < 0.80:
		return 202
	case v < 0.88:
		return 208
	case v < 0.95:
		return 214
	case v < 1.02:
		return 220
	case v < 1.09:
		return 226
	default:
		return 231 // white-hot
	}
}

// intensityChar chooses a block character based on intensity for texture
func intensityChar(v float64) string {
	switch {
	case v < 0.2:
		return "░"
	case v < 0.4:
		return "▒"
	case v < 0.7:
		return "▓"
	default:
		return "█"
	}
}

// renderLogs draws stylized logs with subtle highlights
func renderLogs(w int) string {
	if w <= 0 {
		return ""
	}
	var b strings.Builder
	// top line of logs with highlights
	for x := 0; x < w; x++ {
		color := 130 // brown
		if x%7 == 0 {
			color = 136 // lighter brown
		}
		ch := "▀"
		b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", color, ch))
	}
	b.WriteString("\n")
	// middle log bodies
	for x := 0; x < w; x++ {
		color := 94 // deep wood tone
		ch := "█"
		if x%13 == 0 {
			color = 130
			ch = "▓"
		}
		b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", color, ch))
	}
	b.WriteString("\n")
	// embers line
	for x := 0; x < w; x++ {
		// glowing embers with random sparkle
		if rand.Float64() < 0.08 {
			b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", 214, "•"))
		} else {
			b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%s\x1b[0m", 52, "·"))
		}
	}
	return b.String()
}

func renderSparks(w int, sparks []spark) string {
	row := make([]rune, w)
	for i := range row {
		row[i] = ' '
	}
	for _, s := range sparks {
		if s.y >= 0 && s.y < 2 { // only overlay some near the top of the base
			if s.x >= 0 && s.x < w {
				row[s.x] = '*'
			}
		}
	}
	var b strings.Builder
	for i := 0; i < w; i++ {
		if row[i] == '*' {
			b.WriteString("\x1b[38;5;226m*\x1b[0m")
		} else {
			b.WriteString(" ")
		}
	}
	return b.String()
}

// simple styles
func dim(s string) string {
	return "\x1b[2m" + s + "\x1b[0m"
}
func styleBold(s string) string {
	return "\x1b[1m" + s + "\x1b[0m"
}

// gradient applies a horizontal gradient between three colors to a string
func gradient(s string, c1, c2, c3 int) string {
	runes := []rune(s)
	n := len(runes)
	if n == 0 {
		return s
	}
	var b strings.Builder
	for i := 0; i < n; i++ {
		t := float64(i) / float64(max(1, n-1))
		var col int
		if t < 0.5 {
			// mix c1 -> c2
			col = pickPalette(c1, c2, t*2)
		} else {
			// mix c2 -> c3
			col = pickPalette(c2, c3, (t-0.5)*2)
		}
		b.WriteString(fmt.Sprintf("\x1b[38;5;%dm%c\x1b[0m", col, runes[i]))
	}
	return b.String()
}

// pickPalette simply chooses one of two close colors based on t
func pickPalette(a, b int, t float64) int {
	if t < 0.5 {
		return a
	}
	return b
}

func main() {
	rand.Seed(time.Now().UnixNano())
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if err := p.Start(); err != nil {
		fmt.Println("error:", err)
	}
}
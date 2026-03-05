# 🖥️ Talking to Computers! - Science Week Assembly

Interactive presentation for KS1 (ages 5-7) about Coding & AI.

## Quick Start

```bash
# Serve locally
cd science-assembly
python3 -m http.server 8000
# Open http://localhost:8000
```

## How It Works

1. **Open presentation** on school computer → `https://your-username.github.io/science-assembly/`
2. **A 4-digit code** appears on screen
3. **Open remote** on your phone → `https://your-username.github.io/science-assembly/manage/`
4. **Enter the code** → Connected! Control slides from your phone

**Fallback:** If phone remote doesn't connect, use `← →` arrow keys on keyboard.

## Keyboard Shortcuts (on presentation screen)

| Key | Action |
|-----|--------|
| `→` or `Space` | Next slide |
| `←` | Previous slide |
| `R` | Reveal next item |
| `↑` / `↓` | Robot: up/down (on robot slide), Reveal/Answer (on AI slide) |
| `A` / `D` | Robot: left/right |
| `C` | Confetti! |

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Science Week Assembly"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/science-assembly.git
git push -u origin main
```

Then: Repository Settings → Pages → Source: `main` branch → Save.

Your site will be at: `https://YOUR-USERNAME.github.io/science-assembly/`

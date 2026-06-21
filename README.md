# Safal Bhalerao — Neural Cosmos

A cinematic, single-page personal website for **Safal S. Bhalerao** — AI / LLM Analyst &
Data Annotation & Quality Specialist.

Built with **Three.js** (a glowing particle "neural core" with Unreal Bloom that morphs and
recolors as you scroll), **GSAP + ScrollTrigger** (cinematic reveals, counters, parallax),
and **Lenis** (buttery smooth scroll). No build step required — pure HTML/CSS/JS over CDNs.

## Run locally

The page uses ES modules + CDN libraries, so open it through a local server (not `file://`):

```bash
# from this folder
python -m http.server 8080
# then visit http://localhost:8080
```

Any static server works (`npx serve`, VS Code Live Server, etc.).

## Deploy (GitHub Pages)

1. Push these files to a repo (e.g. `safalb1.github.io` or any repo).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Done — it's all static.

## Structure

```
index.html      # markup + content (pulled from the CV)
css/style.css   # design system, layout, responsive, reduced-motion
js/scene.js     # Three.js particle core + starfield + bloom (ES module)
js/main.js      # preloader, custom cursor, Lenis, GSAP reveals & theme sync
```

## Customize

- **Colors / palette** — CSS variables at the top of `css/style.css` and the `palette`
  object in `js/scene.js`.
- **Particle density / glow** — `COUNT` and the `UnrealBloomPass` settings in `js/scene.js`.
- **Content** — all copy lives in `index.html`.

Respects `prefers-reduced-motion` (animations + smooth scroll disabled, content shown).

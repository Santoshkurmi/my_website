# santosh.dev: a portfolio that defies gravity

A SolidJS portfolio for **Santosh Kurmi**, built around AntiGem's tagline *"a gem that defies gravity"*.

- **Gravity switch**: flip it and the whole hero (name letters, gem, buttons, stats) becomes rigid bodies that fall, stack, and can be dragged and thrown. Flip it back and everything floats home. On phones you can tilt to steer gravity. (matter-js, loaded only on first flip.)
- **A real-time faceted gem** drawn in Canvas2D (no three.js). It follows the cursor, takes its colours from the theme, and spins when clicked.
- **Anti-gravity dust**: background particles drift *up*, and fall when gravity is on.
- **AntiGem section**: phone mockup with real screenshots, live star count, an orbit of the ecosystem repos, and an animated architecture diagram.
- **Periodic table of languages**, a **scroll-driven trajectory timeline**, and **bento project cards** with generative cover art.
- **Terminal** (`⌘K` / `Ctrl K` / `` ` ``): `help`, `neofetch`, `ls`, `open <project>`, `goto <section>`, `theme <name>`, `gravity on`, `sudo hire santosh`…
- **5 themes** with a circular view-transition reveal. Live GitHub stats with a JSON fallback.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run check     # type-checks the code AND every config file
```

## Configure everything in `/config`

You never need to touch the code to change content, order, or look.

| File | What it controls |
| --- | --- |
| `site.json` | SEO meta, GitHub username, default theme, effects on/off, nav, **section order and variants**, footer |
| `themes.json` | Colour themes. Add your own: copy a block and change the colours |
| `profile.json` | Name, rotating headline, intro, hero stats, about, contact, socials |
| `ecosystem.json` | The AntiGem section: metrics, features, screenshots, orbit satellites, architecture diagram |
| `projects.json` | Featured projects (bento grid), categories, and the archive list |
| `skills.json` | The periodic table: languages, groups, frameworks and tools |
| `timeline.json` | Journey items |
| `terminal.json` | Prompt, welcome text, and your own terminal commands |

### Layout: reorder, hide, or switch variants

`site.json → layout.sections` is the page, top to bottom. Move entries to reorder, set `"enabled": false` to hide, add `"nav": "Label"` to show it in the navbar. Section numbers (01, 02…) update automatically.

| type | variants | props |
| --- | --- | --- |
| `hero` | `gravity` (default), `minimal` | `gem`, `gravitySwitch`, `mountains`, `mountainLabel`, `hud` |
| `about` | | |
| `ecosystem` | | `phone`, `orbit`, `architecture` (true/false) |
| `marquee` | | `items` (array), `speed` (seconds), `reverse` |
| `projects` | `bento` (default), `grid` | |
| `archive` | | |
| `languages` | `periodic` (default), `compact` | |
| `timeline` | `alternate` (default), `left` | |
| `contact` | | |

You can add as many `marquee` sections as you like (each needs a unique `id`).

### Text styling

In any title, wrap words in asterisks for the italic-serif gradient accent: `"Things I took *apart*, and built"`.

### Projects

```jsonc
{
  "id": "hyprland-arch",          // used by the terminal: open hyprland-arch
  "name": "Hyprland Arch",
  "repo": "hyprland_arch",        // GitHub repo, used for the link and live stars
  "tagline": "...",
  "description": "...",
  "highlights": ["..."],
  "tech": ["archiso", "Hyprland"],
  "language": "Shell",            // colour comes from skills.json
  "category": "systems",          // must match an id in "categories"
  "year": 2023,
  "size": "wide",                 // sm | wide | tall | lg  (bento tile size)
  "cover": { "pattern": "contour", "glyph": "▲" },  // contour | grid | tree | nodes | waves | rings | bars
  "links": [{ "label": "Live site", "href": "https://..." }]
}
```

Want a screenshot instead of generated art? Put it in `public/` and set `"cover": { "image": "assets/my-shot.webp" }`.

### Live GitHub numbers

Stats use `"live"` keys such as `"repo:antigem:stars"`, `"repo:antigem:forks"`, `"user:public_repos"`, `"user:followers"` or `"total:stars"`. The JSON `value` is shown first and used if GitHub's API is unreachable or rate-limited. Turn it off with `site.json → github.live: false`.

### Themes

`themes.json` maps a theme id to colours. `accent`, `accent2`, `accent3` drive the gradients, the gem, the cover art and the glows. `scheme` is `dark` or `light`. Set the default in `site.json → theme.default`; set `allowSwitch: false` to hide the switcher.

### Effects

`site.json → effects` toggles `particles`, `particleDensity`, `cursorGlow`, `grain`, `tilt`, `reveal` and `viewTransitions`. Everything also respects the OS "reduce motion" setting.

## Deploy

`base` is relative (`./`), so `dist/` works anywhere: GitHub Pages (user or project site), Netlify, Vercel, Cloudflare Pages, or any folder.

**GitHub Pages:** push this folder to a repo, then in *Settings → Pages* choose **GitHub Actions** as the source. `.github/workflows/deploy.yml` builds and publishes on every push to `main`. For `https://santoshkurmi.github.io/` name the repo `Santoshkurmi.github.io`.

## Structure

```
config/          ← all content, layout and themes (edit these)
public/assets/   ← avatar and AntiGem screenshots
src/
  App.tsx        ← section registry: type → component
  sections/      ← Hero, About, Ecosystem, Projects, Archive, Languages, Timeline, Contact (+ Marquee, Footer)
  components/    ← Gem (canvas), Atmosphere, Nav, Terminal, ProjectModal, GenCover, bits
  lib/           ← physics (gravity), theme, github, reveal, store, icons
  styles/global.css
```

To add a new kind of section: create `src/sections/MySection.tsx`, register it in `registry` in `App.tsx`, then add `{ "id": "...", "type": "mysection" }` to `site.json`.

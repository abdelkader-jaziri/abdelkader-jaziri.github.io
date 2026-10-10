# Abdelkader Jaziri | Portfolio

A static portfolio website (HTML/CSS/JS, no build step), available in Italian (default), English, French and Arabic.

## Structure

```
abdelkader-jaziri/
├── index.html          # page markup
├── css/styles.css      # design (dark/light theme, RTL, print-as-CV)
├── js/content.js       # ← EDIT THIS: contact details + portfolio photo list
├── js/i18n.js          # all texts in EN / FR / IT / AR
├── js/main.js          # behaviour (language, estimator, gallery, form…)
└── images/
    ├── profile.jpg     # ← his portrait (square, ≥ 800×800)
    └── work/           # ← project photos
```

## Before publishing

1. Open `js/content.js` and replace the placeholder phone, WhatsApp number, email and social links.
2. Add `images/profile.jpg`. Until it exists, the "AJ" monogram is shown.
3. Put project photos in `images/work/` using the names listed in `js/content.js`
   (e.g. `solar-01.jpg`, `electrical-01.jpg`). Tiles without a photo show "Photo coming soon".
   To add more projects, add an entry to the `projects` array.
   Keep each photo under ~500 KB (resize to ~1600 px wide).

## Preview locally

```bash
python3 -m http.server 5510 --directory ~/abdelkader-jaziri
```

Then open http://localhost:5510.

## Hosting

Published with GitHub Pages at https://abdelkader-jaziri.github.io/
(GitHub organization `abdelkader-jaziri`, repository `abdelkader-jaziri.github.io`, branch `main`).

To publish an update:

```bash
git add -A && git commit -m "feat: describe the change" && git push
```

When CSS or JS files change, raise the `?v=` number on their links in `index.html` so visitors get the new version.

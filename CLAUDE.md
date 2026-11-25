# CLAUDE.md – instrukcija AI asistentui

Tai **Piktograma** (reklamos paslaugos, Jonava) – svetainė, sukurta pagal **business-site-node-starter** šabloną (Node.js 22 + Express + EJS + SQLite).
Piktogramos specifika: tema `site.css` pabaigoje („PIKTOGRAMA TEMA“), `heroEffect: 'squares'` (`views/public/partials/squares.ejs`),
šviesios sekcijos `.section--paper`, vizitinės kortelės kūrėjas (`/vizitine-kortele`: `views/public/card.ejs` + `public/js/card.js`, modulis `cardMaker`),
paslaugų ikonos (`icon` laukas, `src/icons.js`), antras telefonas (`phone2`), galerijos aprašai `seed-assets/captions.json`.
Dvi temos: `body.theme-kortele` (numatyta) ir `body.theme-spaustuve` (CSS blokas „TEMA SPAUSTUVĖ“ `site.css` pabaigoje,
pradinis ekranas `views/public/partials/hero-print.ejs`). Tema: `?tema=` → slapukas → nustatymas `theme` → `brand.theme` (`pickTheme()` `src/routes/public.js`).
Vieša svetainė LT/EN + valdymo panelė `/admin`. Kilmė: KD Legacy šokių studijos projektas.

**Neskaityk viso kodo.** Naujam klientui beveik visada užtenka šių failų (eilės tvarka):

| Ką keisti | Failas |
|---|---|
| Pavadinimas, įjungtos skiltys, pradinio ekrano efektas, kūrėjo nuoroda | `src/brand.js` |
| Spalvos (`--accent`, `--accent-rgb`, `--bg`…), šriftai | `public/css/site.css` (`:root`), `public/css/admin.css` (`:root`) |
| Sąsajos tekstai (antraštės, mygtukai, forma) | `locales/lt.json`, `locales/en.json` |
| Pavyzdinis turinys (paslaugos, kainos, D.U.K., kontaktai…) | `src/seed.js` (vykdomas tik kai DB tuščia) |
| Turinio tipų laukai / naujas tipas | `src/resources.js` (admin formos ir DB stulpeliai kuriami automatiškai) |
| Pradinio puslapio skiltys ir išdėstymas | `views/public/home.ejs` |
| Logotipas | numatytai tekstinis iš pavadinimo (`brandLogo()` `src/app.js`); vektorinį galima įdėti kaip KD Legacy projekte (SVG `<symbol>` + helperis) arba įkelti per admin Nustatymus |
| Paveikslėliai galerijai pradžiai | `seed-assets/*.jpg|png|webp` |
| `public/img/` | `favicon.svg`, `apple-touch-icon.png` (180×180), `og-image.png` (1200×630) |

## Architektūra (trumpai)
- `server.js` → `src/seed.js` (pirmas paleidimas) → `src/app.js` (helmet CSP, statiniai failai, `/uploads`).
- `src/routes/public.js` – puslapiai `/` ir `/en`, naujienos, renginiai, galerija, privatumas, užklausos forma (POST, JSON arba redirect), sitemap. Skiltys tikrinamos `on(key)` pagal `brand.modules`.
- `src/routes/admin.js` – sesijos (SQLite store), CSRF (`_csrf` laukas / `?_csrf=` multipart / `X-CSRF-Token`), bendras CRUD `/admin/r/:resource`, užklausos + CSV, nustatymai, slaptažodis, atsarginė kopija ZIP.
- `src/resources.js` – resursų aprašai; `i18n: true` laukas = `_lt` ir `_en` stulpeliai. Lauko tipai: text, textarea, richtext, lines, date, time, url, checkbox, select, image (video – tik nustatymuose).
- Nustatymai (`settings` lentelė, key/value) – `settingsGroups` tame pačiame faile.
- Nuotraukos: `src/uploads.js` – sharp → WebP + `-thumb.webp`, EXIF pašalinamas.
- Šablonuose: `t(key)` vertimai, `S(name)` nustatymas pagal kalbą, `L(row, field)` laukas pagal kalbą, `has.*` ar skiltis rodoma, `brand`.
- Fono vaizdo įrašas: `src/video.js` (ffmpeg-static) fone konvertuoja bet kokį formatą į MP4 su garsu; svetainėje groja nutildytas, garso mygtukas – vietoje taško prie viršutinės eilutės.
- `heroEffect: 'dancers'` – neoniniai šokėjai (moteris + 2 vaikai) ir nupiešta gatvė (`views/public/partials/street.ejs`, grafitis = svetainės pavadinimas).
- Tikram talpinimui Render'e – `render.production.yaml` (Starter + 1 GB diskas).
- Front-end be bibliotekų: `public/js/site.js` (meniu, filtrai, lightbox, forma), `public/js/fx.js` (fono ikonos, šokėjai), `public/js/admin.js`.

## Taisyklės
- Po pakeitimų: `npm test` (integraciniai testai `test/app.test.js`) – turi praeiti.
- Vizualiai tikrinti su Playwright (desktop 1440 ir telefonas 390 px).
- Nekeisti saugumo dalių (CSRF, CSP, sanitize-html, rate limit) be priežasties.
- Lietuviškos raidės (ąčęėįšųūž) turi rodytis visuose šriftuose – šriftai su `latin-ext`.
- Atmintis: `sharp.cache(false)` + `concurrency(1)` (`src/uploads.js`) ir `MALLOC_ARENA_MAX=2` – svetainė telpa į 512 MB (paleista ~130 MB, keliant nuotraukas iki ~210 MB). Nekeisti be priežasties.
- Duomenys: `DATA_DIR` (numatytai `./data`) – `site.sqlite` + `uploads/`. Niekada necommit'inti.

## Naujas klientas – darbo eiga
1. `src/brand.js`: `defaultName`, `modules`, `heroEffect`.
2. Spalvos `:root` abiejuose CSS.
3. `src/seed.js`: tikri kontaktai, tekstai, paslaugos, kainos.
4. `locales/*.json`: skilčių antraštės pagal verslą.
5. Logotipas, `favicon.svg`, `og-image.png`.
6. `render.yaml` – `name`. `npm test`, ekrano nuotraukos, commit.

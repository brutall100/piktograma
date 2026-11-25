# Piktograma – reklamos paslaugos, Jonava

Pristatomoji svetainė **PIKTOGRAMA, UAB** (Kauno g. 4, Jonava; veikia nuo 1996 m.) – vizitinės kortelės,
spaudos darbai, iškabos, šviesdėžės, lipdukai, reklama ant automobilių ir drabužių.
Sukurta pagal šabloną [business-site-node-starter](https://github.com/brutall100/business-site-node-starter).

**Kas pritaikyta Piktogramai**

- **Dizainas pagal vizitinę kortelę:** juoda / balta / raudona (`#e53126`), įstrižainės ir rombų motyvas,
  logotipas „PIKTOGRAMA“ (Quicksand) + rašytinis „reklamos paslaugos“ (Marck Script). Šriftai ~25 % mažesni nei šablone.
- **Pradinis puslapis:** paslaugos su ikonomis (9), „Kaip dirbame“ (4 žingsniai), vizitinės kūrėjo reklama,
  darbų galerija (pavyzdinės iliustracijos `seed-assets/`), orientacinės kainos, naujienos ir akcijos, D.U.K., užklausa, kontaktai (2 telefonai).
- **Vizitinės kortelės kūrėjas** (`/vizitine-kortele`, `/en/business-card`): 6 šablonai, akcento spalva, šriftas,
  logotipas (lieka naršyklėje), dvipusė kortelė; atsisiuntimas **PDF spaudai** (96 × 56 mm su 3 mm užlaidomis, 600 dpi, TrimBox)
  ir **PNG**; „Užsakyti spausdinimą“ – užklausa su kortelės duomenimis, kiekiu ir popieriumi patenka į admin „Užklausos“.
  Kodas: `public/js/card.js`, `views/public/card.ejs`.
- **Dvi dizaino temos** (tas pats turinys):
  - **Kortelė** (numatyta) – tamsi, įstrižainės ir rombai kaip vizitinėje kortelėje;
  - **Spaustuvė** – šviesus „popierius“, spaudos ženklai (kirpimo žymės, registracijos ženklai, CMYK juostelė),
    pradiniame ekrane atkurta tikroji Piktogramos vizitinė, paslaugos – numeruotas sąrašas, kainos – kainoraštis,
    užklausa – „užsakymo lapas“.
  Tema keičiama admin → Nustatymai → Dizainas. Peržiūrai be nustatymo keitimo: `?tema=spaustuve` / `?tema=kortele`
  (įsimenama slapuku); kol rodoma pristatymo juosta, joje yra perjungiklis.
- **Išjungta:** tvarkaraštis, komanda, renginiai (`src/brand.js`). Atsiliepimai rodomi, kai admin panelėje įvedamas bent vienas.

> Kainos, darbo laikas ir darbų pavyzdžiai – **pavyzdiniai** (viršuje rodoma juosta „Svetainės pristatymo versija…“).
> Ją išjungti: admin → Nustatymai, arba `settings.demo_content`.

---

## Šablonas: business-site-node-starter

Smulkaus verslo svetainės **šablonas** su valdymo panele: kirpyklai, kavinei, studijai, meistrui, klinikai ir pan.
Klientas pats rašo naujienas, kelia nuotraukas, keičia paslaugas, kainas ir kontaktus – be programuotojo.

- **Node.js 22 + Express + SQLite** – vienas serveris, jokių išorinių paslaugų.
- **Dvi kalbos:** lietuvių (`/`) ir anglų (`/en`).
- **Valdymo panelė** (`/admin`): naujienos, renginiai, galerija (kelių nuotraukų įkėlimas, tvarka tempiant), paslaugos, tvarkaraštis, komanda, kainos, atsiliepimai, D.U.K., užklausos (CSV), nustatymai, atsarginė kopija (ZIP).
- **Dizainas:** tamsus fonas + viena akcento spalva, animuoti prožektoriai, bėganti juosta; pritaikyta telefonams.
- **Saugumas:** bcrypt, CSRF, CSP, HTML valymas, apsauga nuo robotų formoje.
- **Talpinimas:** Render (`render.yaml`), Docker, VPS.

---

## Nauja svetainė iš šablono – žingsnis po žingsnio

1. GitHub'e šioje saugykloje spauskite **Use this template → Create a new repository**.
   Pavadinkite pagal klientą, pvz. `kirpykla-svetaine`.
2. Pasiklonuokite ir paleiskite:
   ```bash
   npm install
   npm start          # http://localhost:3000 ir /admin (slaptažodis rodomas konsolėje)
   ```
3. Pritaikykite klientui (arba duokite tai Claude – instrukcija faile [`CLAUDE.md`](CLAUDE.md)):

   | Kas | Kur |
   |---|---|
   | Pavadinimas, kurios skiltys įjungtos, fono efektas, kūrėjo nuoroda | `src/brand.js` |
   | Spalvos | `public/css/site.css` ir `public/css/admin.css` – `:root` (`--accent`, `--accent-rgb`) |
   | Tekstai (antraštės, mygtukai) | `locales/lt.json`, `locales/en.json` |
   | Pradinis turinys (kontaktai, paslaugos, kainos…) | `src/seed.js` |
   | Galerijos nuotraukos pradžiai | `seed-assets/` |
   | Ikona ir socialinių tinklų paveikslėlis | `public/img/` |

4. Ištrinkite `data/` katalogą (jei paleidote anksčiau), kad pradinis turinys būtų įrašytas iš naujo, ir patikrinkite: `npm test`.
5. Įkelkite į GitHub ir paleiskite internete (žr. žemiau).

### Prompt'as Claude naujam klientui

> Šis projektas sukurtas iš `business-site-node-starter` šablono – perskaityk `CLAUDE.md`.
> Klientas: **[pavadinimas]**, [veiklos sritis], [miestas]. Kontaktai: [adresas, tel., el. paštas, FB/IG].
> Spalvos: [pvz. juoda + auksinė]. Skiltys: [pvz. paslaugos, kainos, galerija, be tvarkaraščio].
> Logotipas: [pridedu / tekstinis]. Pritaikyk, ištestuok ir įkelk į main.

---

## Paleidimas internete

### Render (paprasčiausia)
1. <https://render.com> → **New → Blueprint** → pasirinkite saugyklą.
2. Įveskite `ADMIN_PASSWORD` → **Apply**.
3. Nemokamas planas tinka tik peržiūrai (užmiega, duomenys dingsta po perkrovimo).
   Tikrai svetainei `render.yaml` pakeiskite `plan: starter` ir pridėkite diską:
   ```yaml
       plan: starter
       disk:
         name: data
         mountPath: /data
         sizeGB: 1
       envVars:
         - key: DATA_DIR
           value: /data
   ```
   Domeną pridėkite **Settings → Custom Domains**. Kaina ~7–8 $/mėn.

### Render su disku (tikra svetainė)
Paruoštas `render.production.yaml` (Starter 7 $/mėn. + 1 GB diskas): **New → Blueprint → Blueprint Path:** `render.production.yaml`.

### Docker
```bash
cp .env.example .env && docker compose up -d --build
```

### VPS (Ubuntu)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs nginx
git clone <saugykla> /srv/site && cd /srv/site && npm ci --omit=dev && cp .env.example .env
sudo npm i -g pm2 && pm2 start server.js --name site && pm2 save && pm2 startup
```
Nginx `proxy_pass http://127.0.0.1:3000;`, `client_max_body_size 160m;`, HTTPS – `certbot --nginx`.

---

## Nustatymai (.env)
Žr. [`.env.example`](.env.example): `PORT`, `SITE_URL`, `NODE_ENV`, `DATA_DIR`, `ADMIN_USER`, `ADMIN_PASSWORD`, `TRUST_PROXY`, `SMTP_*` (el. laiškai apie naujas užklausas).

Slaptažodžio atstatymas serveryje: `npm run reset-password`.

## Atsarginės kopijos
Admin → **Atsarginė kopija** → ZIP (duomenų bazė + nuotraukos). Visi duomenys – `DATA_DIR` kataloge (`site.sqlite`, `uploads/`).

## Struktūra
```
src/brand.js          ← projekto nustatymai (pradėkite čia)
src/resources.js      turinio tipai ir laukai → admin formos ir DB
src/seed.js           pradinis turinys
src/routes/           public.js (svetainė), admin.js (valdymo panelė)
views/public, admin   EJS šablonai
locales/              LT / EN tekstai
public/css, js, fonts, img
test/                 npm test
```

---
Sukūrė [AlditeQ](https://aldas-portfolio.site/).

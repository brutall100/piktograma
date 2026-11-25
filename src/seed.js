'use strict';

/**
 * Pradinis (pavyzdinis) Piktogramos turinys. Įrašomas tik vieną kartą – kai duomenų bazė tuščia.
 * Naujam klientui pakeiskite tekstus čia ARBA vėliau per admin panelę.
 * Paveikslėliai iš katalogo `seed-assets/` (jpg, png, webp) įkeliami į galeriją.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const brand = require('./brand');
const { db, getSettings, setSettings } = require('./db');
const { saveImage } = require('./uploads');

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function insert(table, row) {
  const keys = Object.keys(row);
  const info = db
    .prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
    .run(...keys.map((k) => row[k]));
  return info.lastInsertRowid;
}

/* ------------------------------------------------------------------ */
/* Nustatymai (Admin → Nustatymai)                                     */
/* ------------------------------------------------------------------ */

const defaults = {
  site_name: brand.defaultName,
  hero_overline_lt: 'Jonava · Nuo 1996 m.',
  hero_overline_en: 'Jonava, Lithuania · Since 1996',
  hero_tagline_lt: 'Reklama, kurią pastebi.',
  hero_tagline_en: 'Advertising that gets noticed.',
  hero_text_lt:
    'Vizitinės kortelės, spaudos darbai, iškabos, šviesdėžės ir reklama ant automobilių – nuo idėjos iki pagaminto ir sumontuoto darbo vienoje vietoje.',
  hero_text_en:
    'Business cards, print, signs, light boxes and vehicle graphics – from the first idea to a finished, installed job, all in one place.',
  marquee_lt: ['Vizitinės kortelės', 'Plakatai', 'Iškabos', 'Šviesdėžės', 'Tūrinės raidės', 'Lipdukai', 'Reklama ant automobilių', 'Roll-up stendai', 'Kalendoriai'].join('\n'),
  marquee_en: ['Business cards', 'Posters', 'Signs', 'Light boxes', '3D letters', 'Stickers', 'Vehicle graphics', 'Roll-up stands', 'Calendars'].join('\n'),
  about_title_lt: 'Nuo idėjos iki montavimo',
  about_title_en: 'From idea to installation',
  about_text_lt: [
    'Piktograma – reklamos gamybos įmonė Jonavoje, veikianti nuo 1996 metų. Kuriame ir gaminame viską, ko reikia, kad jūsų verslas būtų matomas: nuo vizitinės kortelės iki iškabos ant fasado.',
    'Dirbame su smulkiuoju verslu, įstaigomis ir privačiais klientais. Padedame sugalvoti, sumaketuoti, pagaminti ir sumontuoti – nereikia ieškoti kelių skirtingų tiekėjų.',
  ].join('\n\n'),
  about_text_en: [
    'Piktograma is an advertising production company in Jonava, Lithuania, working since 1996. We design and make everything your business needs to be seen – from a business card to a sign on the facade.',
    'We work with small businesses, institutions and private clients. We help you come up with the idea, lay it out, produce and install it – no need to look for several different suppliers.',
  ].join('\n\n'),
  stat1_value: '30',
  stat1_label_lt: 'metų patirties',
  stat1_label_en: 'years of experience',
  stat2_value: '9',
  stat2_label_lt: 'paslaugų kryptys',
  stat2_label_en: 'service lines',
  stat3_value: '1',
  stat3_label_lt: 'vieta viskam',
  stat3_label_en: 'place for everything',
  address: 'Kauno g. 4',
  city: 'Jonava',
  phone: '+370 349 61777',
  phone2: '+370 685 58816',
  email: 'piktograma@gmail.com',
  map_query: 'Kauno g. 4, Jonava',
  hours_lt: 'I–V 8:00–17:00\nVI–VII nedirbame',
  hours_en: 'Mon–Fri 8:00–17:00\nSat–Sun closed',
  seo_description_lt:
    'Piktograma – reklamos paslaugos Jonavoje nuo 1996 m.: vizitinės kortelės, spauda, iškabos, šviesdėžės, lipdukai, reklama ant automobilių ir drabužių.',
  seo_description_en:
    'Piktograma – advertising services in Jonava since 1996: business cards, print, signs, light boxes, stickers, vehicle and apparel branding.',
  demo_content: '1',
};

async function seedGallery() {
  const dir = path.join(config.ROOT, 'seed-assets');
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)).sort();
  } catch {
    return;
  }
  // Neprivalomi aprašai: seed-assets/captions.json → { "failas.jpg": ["LT", "EN"] }
  let captions = {};
  try {
    captions = JSON.parse(fs.readFileSync(path.join(dir, 'captions.json'), 'utf8'));
  } catch {
    /* aprašų nėra */
  }
  // Failai rodomi abėcėlės tvarka (01, 02, …); naujai įkeltos nuotraukos atsiras priekyje.
  let sort = 1;
  for (const file of files) {
    try {
      const image = await saveImage(path.join(dir, file));
      const [lt = '', en = ''] = captions[file] || [];
      insert('gallery', { image, caption_lt: lt, caption_en: en, sort: sort++, created_at: new Date().toISOString() });
    } catch (err) {
      console.warn(`[seed] nepavyko įkelti ${file}: ${err.message}`);
    }
  }
}

async function seed() {
  if (getSettings().seeded) return false;
  const now = new Date().toISOString();

  setSettings(defaults);

  /* --- Paslaugos --- */
  const services = [
    ['card', 'Vizitinės kortelės', 'Business cards',
      'Vienpusės ar dvipusės, matinės ar blizgios, ant įvairaus storio popieriaus. Maketą sukursime patys arba spausdinsime jūsų.',
      'Single or double-sided, matte or gloss, on a range of paper weights. We can design the layout or print yours.',
      'nuo 100 vnt.', 'from 100 pcs', 'nuo 15 €', 'from €15'],
    ['print', 'Spaudos darbai', 'Printing',
      'Skrajutės, lankstinukai, plakatai, kvietimai, blankai, kalendoriai ir kiti spaudiniai – nuo A6 iki didelio formato.',
      'Flyers, leaflets, posters, invitations, forms, calendars and more – from A6 up to large format.',
      'A6–A0', 'A6–A0', 'nuo 0,10 € / vnt.', 'from €0.10 / pc'],
    ['sign', 'Iškabos ir lauko reklama', 'Signs & outdoor',
      'Iškabos, reklaminiai skydai, stendai ir tentai su spauda. Pagaminame ir sumontuojame.',
      'Shop signs, advertising boards, stands and printed banners. We make and install them.',
      'gamyba + montavimas', 'make + install', 'pagal užklausą', 'on request'],
    ['lightbox', 'Šviesdėžės ir tūrinės raidės', 'Light boxes & 3D letters',
      'Šviečiančios iškabos ir tūrinės raidės su LED apšvietimu – jūsų verslas matomas ir vakare.',
      'Illuminated signs and 3D letters with LED lighting – your business stays visible after dark.',
      'LED apšvietimas', 'LED lighting', 'nuo 250 €', 'from €250'],
    ['car', 'Reklama ant automobilių', 'Vehicle graphics',
      'Logotipai, kontaktai ar pilnas apklijavimas plėvele lengviesiems ir krovininiams automobiliams.',
      'Logos, contact details or full film wraps for cars and vans.',
      'lengvieji ir krovininiai', 'cars and vans', 'nuo 60 €', 'from €60'],
    ['sticker', 'Lipdukai ir ploteris', 'Stickers & cut vinyl',
      'Lipdukai bet kokios formos, vitrinų ir langų apklijavimas, ploterinis pjovimas.',
      'Stickers of any shape, shop window graphics and plotter-cut vinyl.',
      'bet kokia forma', 'any shape', 'nuo 15 € / m²', 'from €15 / m²'],
    ['shirt', 'Reklama ant drabužių', 'Branded apparel',
      'Marškinėliai, džemperiai, kepurės ir darbo rūbai su jūsų logotipu ar užrašu.',
      'T-shirts, hoodies, caps and workwear with your logo or text.',
      'nuo 1 vnt.', 'from 1 pc', 'nuo 8 €', 'from €8'],
    ['rollup', 'Roll-up ir stendai', 'Roll-ups & displays',
      'Roll-up stendai, informaciniai ir parodų stendai – patogu nešiotis, greitai pastatoma.',
      'Roll-up banners, information and exhibition stands – easy to carry, quick to set up.',
      'su krepšiu', 'with carry bag', 'nuo 65 €', 'from €65'],
    ['design', 'Dizainas ir maketavimas', 'Design & layout',
      'Logotipai, firminis stilius ir maketai spaudai. Paruošiame failus taip, kad rezultatas būtų toks, kokio tikitės.',
      'Logos, brand identity and print-ready layouts. We prepare files so the result is exactly what you expect.',
      'idėja → maketas', 'idea → layout', 'nuo 20 €', 'from €20'],
  ];
  services.forEach(([icon, lt, en, dlt, den, t1lt, t1en, t2lt, t2en], i) =>
    insert('services', {
      name_lt: lt,
      name_en: en,
      description_lt: dlt,
      description_en: den,
      tag1_lt: t1lt,
      tag1_en: t1en,
      tag2_lt: t2lt,
      tag2_en: t2en,
      icon,
      image: '',
      sort: i + 1,
      created_at: now,
    })
  );

  /* --- Kainos (orientacinės) --- */
  [
    ['Vizitinės kortelės', 'Business cards', 'nuo 15 €', '/ 100 vnt.', '/ 100 pcs',
      'Spalvota spauda vienoje pusėje\n350 g/m² kreidinis popierius\nMaketo pataisymai\nPagaminama per 2–3 d. d.',
      'Full colour, one side\n350 gsm coated paper\nLayout corrections\nReady in 2–3 working days', 1],
    ['Skrajutės A5', 'A5 flyers', 'nuo 35 €', '/ 500 vnt.', '/ 500 pcs',
      'Spalvota spauda abiejose pusėse\n130 g/m² kreidinis popierius\nPagaminama per 3–4 d. d.',
      'Full colour, both sides\n130 gsm coated paper\nReady in 3–4 working days', 0],
    ['Roll-up stendas', 'Roll-up stand', 'nuo 65 €', '/ vnt.', '/ pc',
      '85 × 200 cm\nSpauda ir konstrukcija\nTransportavimo krepšys',
      '85 × 200 cm\nPrint and frame\nCarry bag', 0],
    ['Reklama ant automobilio', 'Vehicle branding', 'nuo 60 €', '', '',
      'Logotipas ir kontaktai\nAtspari lauko plėvelė\nUžklijuojame vietoje',
      'Logo and contact details\nDurable outdoor film\nApplied on site', 0],
  ].forEach(([lt, en, price, plt, pen, flt, fen, hot], i) =>
    insert('prices', {
      name_lt: lt,
      name_en: en,
      price,
      period_lt: plt,
      period_en: pen,
      features_lt: flt,
      features_en: fen,
      highlighted: hot,
      sort: i + 1,
      created_at: now,
    })
  );

  /* --- D.U.K. --- */
  [
    ['Ar sukursite maketą, jei jo neturiu?',
      'Taip. Papasakokite, ko reikia, atsiųskite logotipą ir tekstus – paruošime maketą ir atsiųsime derinti. Spausdiname tik jums patvirtinus.',
      'Can you design the layout if I don’t have one?',
      'Yes. Tell us what you need and send your logo and texts – we will prepare a layout for your approval. We only print once you confirm.'],
    ['Kokiu formatu pateikti savo failus?',
      'Geriausia – PDF su 3 mm užlaidomis ir tekstais, paverstais kreivėmis. Tinka ir AI, EPS, SVG, CDR. Nuotraukos – ne mažesnės nei 300 dpi tikruoju dydžiu.',
      'What file format should I send?',
      'Ideally a PDF with 3 mm bleed and text converted to outlines. AI, EPS, SVG and CDR also work. Photos should be at least 300 dpi at actual size.'],
    ['Per kiek laiko pagaminsite?',
      'Vizitinės kortelės ir smulkūs spaudiniai dažniausiai paruošiami per 1–3 darbo dienas. Iškabos, šviesdėžės ir lauko reklama – pagal sudėtingumą, aptarsime iš anksto. Skubūs užsakymai – susitarus.',
      'How long does it take?',
      'Business cards and small print jobs are usually ready in 1–3 working days. Signs, light boxes and outdoor advertising depend on complexity – we agree on timing upfront. Rush orders by arrangement.'],
    ['Ar montuojate iškabas ir apklijuojate automobilius?',
      'Taip – iškabas, stendus ir šviesdėžes sumontuojame Jonavoje ir apylinkėse, automobilius apklijuojame vietoje.',
      'Do you install signs and wrap vehicles?',
      'Yes – we install signs, stands and light boxes in Jonava and the surrounding area, and apply vehicle graphics on site.'],
    ['Ar galima užsakyti mažą kiekį?',
      'Taip. Marškinėlius su užrašu ar lipdukus galima užsakyti ir po vieną, o vizitines korteles – nuo 100 vienetų.',
      'Can I order a small quantity?',
      'Yes. T-shirts and stickers can be ordered even as a single piece; business cards start at 100.'],
    ['Kaip veikia vizitinės kortelės kūrėjas?',
      'Svetainėje įrašykite savo duomenis, pasirinkite šabloną ir spalvą – kortelę matysite iš karto. Ją galite atsisiųsti kaip PDF spaudai arba PNG, o paspaudę „Užsakyti spausdinimą“ – atsiųsti mums.',
      'How does the business card maker work?',
      'Enter your details on the website, choose a template and colour – you see the card instantly. Download it as a print-ready PDF or PNG, or tap “Order printing” to send it to us.'],
  ].forEach(([qlt, alt, qen, aen], i) =>
    insert('faq', { question_lt: qlt, answer_lt: alt, question_en: qen, answer_en: aen, sort: i + 1, created_at: now })
  );

  /* --- Atsiliepimai: tikrus įveskite admin panelėje (skiltis atsiras automatiškai) --- */

  /* --- Naujienos ir akcijos --- */
  let newsImage = '';
  try {
    newsImage = await saveImage(path.join(config.ROOT, 'seed-assets', 'news', 'kalendoriai-2027.jpg'));
  } catch {
    /* paveikslėlio nėra – naujiena be jo */
  }
  insert('news', {
    title_lt: 'Priimame 2027 m. kalendorių užsakymus',
    title_en: 'Now taking orders for 2027 calendars',
    summary_lt: 'Sieniniai, staliniai ir kišeniniai kalendoriai su jūsų logotipu – puiki dovana klientams ir partneriams.',
    summary_en: 'Wall, desk and pocket calendars with your logo – a great gift for clients and partners.',
    body_lt:
      '<p>Metų pabaiga – geriausias laikas priminti apie save. Gaminame kalendorius su jūsų logotipu ir nuotraukomis:</p><ul><li>sieninius (vieno ar 12 lapų),</li><li>stalinius „namelius“,</li><li>kišeninius kalendoriukus.</li></ul><p>Užsakykite iki gruodžio vidurio – spėsime iki švenčių. Maketą padėsime paruošti.</p>',
    body_en:
      '<p>The end of the year is the best time to remind people about you. We make calendars with your logo and photos:</p><ul><li>wall calendars (single sheet or 12 pages),</li><li>desk calendars,</li><li>pocket calendars.</li></ul><p>Order by mid-December to have them before the holidays. We will help with the layout.</p>',
    image: newsImage,
    published_at: addDays(-3),
    published: 1,
    created_at: now,
  });

  await seedGallery();

  setSettings({ seeded: '1' });
  return true;
}

module.exports = { seed };

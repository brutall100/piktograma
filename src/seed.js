'use strict';

/**
 * Pradinis (pavyzdinis) turinys. Įrašomas tik vieną kartą – kai duomenų bazė tuščia.
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
  hero_overline_lt: 'Jūsų miestas · Nuo 2015 m.',
  hero_overline_en: 'Your city · Since 2015',
  hero_tagline_lt: 'Trumpas, įsimenantis šūkis.',
  hero_tagline_en: 'A short, memorable tagline.',
  hero_text_lt:
    'Vienas–du sakiniai apie tai, ką darote ir kuo esate išskirtiniai. Šį tekstą pakeisite admin panelėje: Nustatymai → Pradinis ekranas.',
  hero_text_en:
    'One or two sentences about what you do and what makes you different. Change this text in the admin panel: Settings → Hero.',
  about_title_lt: 'Daugiau nei tiesiog paslauga',
  about_title_en: 'More than just a service',
  about_text_lt: [
    'Čia – trumpas pristatymas: kas jūs esate, kuo užsiimate ir kam padedate.',
    'Antroje pastraipoje papasakokite apie savo vertybes, patirtį ar istoriją. Tuščia eilutė pradeda naują pastraipą.',
  ].join('\n\n'),
  about_text_en: [
    'A short introduction: who you are, what you do and who you help.',
    'In the second paragraph tell about your values, experience or story. An empty line starts a new paragraph.',
  ].join('\n\n'),
  stat1_value: '10+',
  stat1_label_lt: 'metų patirties',
  stat1_label_en: 'years of experience',
  stat2_value: '500+',
  stat2_label_lt: 'patenkintų klientų',
  stat2_label_en: 'happy clients',
  hours_lt: 'I–V 9:00–18:00\nVI 10:00–14:00',
  hours_en: 'Mon–Fri 9:00–18:00\nSat 10:00–14:00',
  seo_description_lt: 'Trumpas svetainės aprašymas paieškos sistemoms (iki ~160 simbolių).',
  seo_description_en: 'A short description of the website for search engines (up to ~160 characters).',
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
  let sort = files.length;
  for (const file of files) {
    try {
      const image = await saveImage(path.join(dir, file));
      insert('gallery', { image, caption_lt: '', caption_en: '', sort: sort--, created_at: new Date().toISOString() });
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
  const serviceIds = [
    ['Pirmoji paslauga', 'First service', '60 min.', '60 min', 'nuo 30 €', 'from €30'],
    ['Antroji paslauga', 'Second service', '90 min.', '90 min', 'nuo 45 €', 'from €45'],
    ['Trečioji paslauga', 'Third service', 'Individualiai', 'Tailored', 'pagal susitarimą', 'on request'],
  ].map(([lt, en, t1lt, t1en, t2lt, t2en], i) =>
    insert('services', {
      name_lt: lt,
      name_en: en,
      description_lt: 'Trumpas paslaugos aprašymas: kas įeina, kam ji skirta ir kokią naudą gaus klientas.',
      description_en: 'A short description: what is included, who it is for and what the client gets.',
      tag1_lt: t1lt,
      tag1_en: t1en,
      tag2_lt: t2lt,
      tag2_en: t2en,
      image: '',
      sort: i + 1,
      created_at: now,
    })
  );

  /* --- Komanda --- */
  const memberIds = [
    ['Vadovė', 'Founder'],
    ['Specialistas', 'Specialist'],
  ].map(([lt, en], i) =>
    insert('team', {
      name: 'Vardas Pavardė',
      role_lt: lt,
      role_en: en,
      bio_lt: 'Trumpas aprašymas – patirtis, specializacija, pasiekimai.',
      bio_en: 'A short bio – experience, specialisation, achievements.',
      image: '',
      instagram: '',
      sort: i + 1,
      created_at: now,
    })
  );

  /* --- Tvarkaraštis (rodomas tik jei įjungtas src/brand.js) --- */
  for (const [weekday, start, end, si, mi] of [
    [1, '18:00', '19:00', 0, 0],
    [3, '18:00', '19:30', 1, 1],
    [6, '11:00', '12:00', 0, 0],
  ]) {
    insert('schedule', {
      weekday,
      start_time: start,
      end_time: end,
      service_id: serviceIds[si],
      title_lt: '',
      title_en: '',
      group_name_lt: 'Grupė',
      group_name_en: 'Group',
      member_id: memberIds[mi],
      hall: '',
      created_at: now,
    });
  }

  /* --- Kainos --- */
  [
    ['Bazinis', 'Basic', '29 €', 'Viena paslauga\nKonsultacija', 'One service\nConsultation', 0],
    ['Populiarus', 'Popular', '49 €', 'Dvi paslaugos\nKonsultacija\nNuolaida kitam kartui', 'Two services\nConsultation\nDiscount next time', 1],
    ['Premium', 'Premium', '89 €', 'Visos paslaugos\nPrioritetinis laikas\nAsmeninis planas', 'All services\nPriority booking\nPersonal plan', 0],
  ].forEach(([lt, en, price, flt, fen, hot], i) =>
    insert('prices', {
      name_lt: lt,
      name_en: en,
      price,
      period_lt: '/ mėn.',
      period_en: '/ month',
      features_lt: flt,
      features_en: fen,
      highlighted: hot,
      sort: i + 1,
      created_at: now,
    })
  );

  /* --- D.U.K. --- */
  [
    ['Kaip užsiregistruoti?', 'Užpildykite užklausos formą šiame puslapyje arba paskambinkite – suderinsime laiką.', 'How do I book?', 'Fill in the enquiry form on this page or give us a call – we will arrange a time.'],
    ['Kokie atsiskaitymo būdai?', 'Grynaisiais, kortele arba pavedimu.', 'How can I pay?', 'Cash, card or bank transfer.'],
    ['Ar galima atšaukti ar perkelti vizitą?', 'Taip – praneškite bent prieš 24 valandas.', 'Can I cancel or reschedule?', 'Yes – please let us know at least 24 hours in advance.'],
  ].forEach(([qlt, alt, qen, aen], i) =>
    insert('faq', { question_lt: qlt, answer_lt: alt, question_en: qen, answer_en: aen, sort: i + 1, created_at: now })
  );

  /* --- Atsiliepimai --- */
  insert('testimonials', {
    author: 'Vardas P.',
    role_lt: 'klientė',
    role_en: 'client',
    text_lt: 'Čia bus tikro kliento atsiliepimas. Trumpas, nuoširdus ir konkretus.',
    text_en: 'A real client testimonial will go here. Short, sincere and specific.',
    sort: 1,
    created_at: now,
  });

  /* --- Naujienos --- */
  insert('news', {
    title_lt: 'Sveiki atvykę į naują svetainę!',
    title_en: 'Welcome to our new website!',
    summary_lt: 'Nuo šiol naujienas, renginius ir informaciją rasite vienoje vietoje.',
    summary_en: 'From now on you will find news, events and information in one place.',
    body_lt:
      '<p>Džiaugiamės galėdami pristatyti naują svetainę. Čia rasite:</p><ul><li>mūsų paslaugas ir kainas,</li><li>naujienas ir renginius,</li><li>kontaktus ir užklausos formą.</li></ul>',
    body_en:
      '<p>We are happy to present our new website. Here you will find:</p><ul><li>our services and prices,</li><li>news and events,</li><li>contacts and an enquiry form.</li></ul>',
    image: '',
    published_at: addDays(-2),
    published: 1,
    created_at: now,
  });

  /* --- Renginiai --- */
  insert('events', {
    title_lt: 'Atvirų durų diena',
    title_en: 'Open day',
    date: addDays(21),
    time: '12:00',
    end_date: '',
    location_lt: 'Mūsų adresas',
    location_en: 'Our address',
    description_lt: '<p>Ateikite susipažinti, užduoti klausimų ir išbandyti mūsų paslaugas.</p>',
    description_en: '<p>Come and meet us, ask questions and try our services.</p>',
    image: '',
    link: '',
    published: 1,
    created_at: now,
  });

  await seedGallery();

  setSettings({ seeded: '1' });
  return true;
}

module.exports = { seed };

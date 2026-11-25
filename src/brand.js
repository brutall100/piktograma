'use strict';

/**
 * ============================================================
 *  PROJEKTO NUSTATYMAI – pirmas failas, kurį keičiate naujam klientui.
 * ============================================================
 *
 *  Spalvos ir šriftai: public/css/site.css (`:root` pradžioje) ir public/css/admin.css.
 *  Sąsajos tekstai: locales/lt.json, locales/en.json.
 *  Pradinis (pavyzdinis) turinys: src/seed.js.
 *  Turinio tipų laukai: src/resources.js.
 */
module.exports = {
  // Pavadinimas, kol administratorius jo nepakeitė Nustatymuose.
  defaultName: 'Jūsų verslas',

  // Kurios skiltys įjungtos. Išjungta skiltis dingsta iš svetainės ir admin panelės.
  modules: {
    services: true, // Paslaugos (kortelės)
    schedule: false, // Savaitės tvarkaraštis (studijoms, būreliams, sporto klubams)
    team: true, // Komanda
    prices: true, // Kainos
    events: true, // Renginiai
    news: true, // Naujienos
    gallery: true, // Galerija
    testimonials: true, // Atsiliepimai
    faq: true, // D.U.K.
  },

  // Pradinio ekrano efektas, kai neįkeltas fono vaizdo įrašas:
  //   'spotlights' – judantys prožektorių spinduliai
  //   'dancers'    – spinduliai + neoniniai šokantys siluetai (šokių studijoms)
  //   'none'       – ramus fonas
  heroEffect: 'spotlights',

  // Plaukiojančios ikonos fone (natos, žvaigždutės, žiedai…). false – išjungti.
  floatingIcons: true,

  // Kūrėjo nuoroda poraštėje. null – nerodyti.
  credit: { label: 'AlditeQ', url: 'https://aldas-portfolio.site/' },
};

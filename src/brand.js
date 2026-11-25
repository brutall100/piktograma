'use strict';

/**
 * ============================================================
 *  PROJEKTO NUSTATYMAI – PIKTOGRAMA (reklamos paslaugos, Jonava)
 * ============================================================
 *
 *  Spalvos ir šriftai: public/css/site.css (`:root` pradžioje) ir public/css/admin.css.
 *  Sąsajos tekstai: locales/lt.json, locales/en.json.
 *  Pradinis (pavyzdinis) turinys: src/seed.js.
 *  Turinio tipų laukai: src/resources.js.
 */
module.exports = {
  // Pavadinimas, kol administratorius jo nepakeitė Nustatymuose.
  defaultName: 'Piktograma',

  // Rašytinis užrašas po tekstiniu logotipu (kaip vizitinėje kortelėje).
  // Naudojamas, kai pavadinimas – vienas žodis. null – nerodyti.
  logoScript: 'reklamos paslaugos',

  // Kurios skiltys įjungtos. Išjungta skiltis dingsta iš svetainės ir admin panelės.
  modules: {
    services: true, // Paslaugos (kortelės)
    schedule: false, // Savaitės tvarkaraštis (studijoms, būreliams, sporto klubams)
    team: false, // Komanda
    prices: true, // Kainos (orientacinės)
    events: false, // Renginiai
    news: true, // Naujienos ir akcijos
    gallery: true, // Darbų galerija
    testimonials: true, // Atsiliepimai (rodomi tik kai yra bent vienas)
    faq: true, // D.U.K.
    cardMaker: true, // Vizitinės kortelės kūrėjas (/vizitine-kortele)
  },

  // Dizaino tema (keičiama ir admin → Nustatymai → Dizainas):
  //   'kortele'   – tamsi, įstrižainės ir rombai kaip vizitinėje kortelėje
  //   'spaustuve' – šviesi „popieriaus“ tema su spaudos ženklais (kirpimo žymės, CMYK)
  // Peržiūrai be nustatymų keitimo: ?tema=spaustuve arba ?tema=kortele (įsimenama slapuku).
  theme: 'kortele',
  themes: ['kortele', 'spaustuve'],

  // Pradinio ekrano efektas, kai neįkeltas fono vaizdo įrašas:
  //   'squares'    – įstrižainė ir rombų kompozicija (kaip Piktogramos vizitinėje)
  //   'spotlights' – judantys prožektorių spinduliai
  //   'dancers'    – spinduliai + neoniniai šokantys siluetai (šokių studijoms)
  //   'none'       – ramus fonas
  heroEffect: 'squares',

  // Plaukiojančios figūros fone (Piktogramai – rombai). false – išjungti.
  floatingIcons: true,

  // Kūrėjo nuoroda poraštėje. null – nerodyti.
  credit: { label: 'AlditeQ', url: 'https://aldas-portfolio.site/' },
};

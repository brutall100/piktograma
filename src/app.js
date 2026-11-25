'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');
const { icon } = require('./icons');
const { thumbName } = require('./uploads');
const { escapeHtml } = require('./helpers');
const { getSettings } = require('./db');
const brand = require('./brand');

const ASSET_VERSION = Date.now().toString(36);

function createApp() {
  const app = express();

  app.set('trust proxy', config.TRUST_PROXY);
  app.set('view engine', 'ejs');
  app.set('views', path.join(config.ROOT, 'views'));
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ['https://www.google.com', 'https://maps.google.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      // HSTS įjungiamas tik produkcijoje (už HTTPS proxy).
      strictTransportSecurity: config.IS_PROD ? { maxAge: 15552000 } : false,
    })
  );
  app.use(compression());

  // Bendros šablonų funkcijos
  app.locals.icon = icon;
  app.locals.asset = (p) => `${p}?v=${ASSET_VERSION}`;
  app.locals.img = (name) => (name ? `/uploads/${name}` : '');
  app.locals.thumb = (name) => (name ? `/uploads/${thumbName(name)}` : '');
  // Tekstinis logotipas iš pavadinimo: pirmas žodis – stambiu šriftu, likę – rašytiniu akcento spalva.
  // Įkėlus logotipą Nustatymuose, šablonai rodo paveikslėlį vietoje šio.
  app.locals.brandLogo = (cls = '', label = '') => {
    const name = String(getSettings().site_name || brand.defaultName).trim();
    const [first, ...rest] = name.split(/\s+/);
    const aria = label ? ` role="img" aria-label="${escapeHtml(label)}"` : '';
    return `<span class="brand-logo ${cls}"${aria}><span class="brand-logo__a">${escapeHtml(first)}</span>${
      rest.length ? ` <span class="brand-logo__b">${escapeHtml(rest.join(' '))}</span>` : ''
    }</span>`;
  };
  app.locals.brand = brand;

  app.use(
    express.static(path.join(config.ROOT, 'public'), {
      maxAge: config.IS_PROD ? '30d' : 0,
      index: false,
    })
  );
  app.use(
    '/uploads',
    express.static(config.UPLOAD_DIR, {
      maxAge: '365d',
      immutable: true,
      index: false,
      dotfiles: 'deny',
      fallthrough: false,
    }),
    // express.static su fallthrough:false klaidas perduoda toliau – grąžinam paprastą 404
    (err, req, res, next) => {
      res.status(404).type('text').send('Not found');
    }
  );

  app.use('/admin', require('./routes/admin'));
  app.use(require('./routes/public'));

  return app;
}

module.exports = { createApp };

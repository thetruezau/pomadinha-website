import { Button } from './Button.js';
import { i18n } from '../I18n.js';
import { el } from '../utils/helpers.js';

// Menu entries: order + translation keys. Add a line here when adding pages.
const MENU = [
  { route: 'about',   key: 'header.about' },
  { route: 'shows',   key: 'header.shows' },
  { route: 'merch',   key: 'header.merch' },
  { route: 'player',  key: 'header.songs' },
  { route: 'gallery', key: 'header.gallery' }
];

export class Header {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('header');
    this.element.className = 'app-header';
  }

  render(parent) {
    this.element.innerHTML = '';

    // Left: language switch (PT / EN)
    const langGroup = el('div', { class: 'lang-group-left' });
    ['pt', 'en'].forEach(lang => {
      const btn = new Button(lang.toUpperCase(), () => this.app.setLanguage(lang));
      if (i18n.currentLang === lang) btn.element.classList.add('active');
      btn.render(langGroup);
    });

    // Center: logo
    const logoBox = el('div', { class: 'logo-center' });
    const logoBtn = new Button(i18n.t('header.logo'), () => this.app.navigate('home'));
    logoBtn.element.classList.add('brand-logo-btn');
    logoBtn.render(logoBox);

    // Right: main navigation
    const nav = el('nav', { class: 'menu-container-right' });
    MENU.forEach(({ route, key }) => {
      const btn = new Button(i18n.t(key), () => this.app.navigate(route));
      if (this.app.currentRoute === route) btn.element.classList.add('active');
      btn.render(nav);
    });

    this.element.append(langGroup, logoBox, nav);
    parent.appendChild(this.element);
  }
}

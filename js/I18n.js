const STORAGE_KEY = 'pomadinha-lang';

export class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = {};
  }

  detectLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'pt' || saved === 'en') return saved;
    } catch (e) { /* storage unavailable */ }
    return 'en';
  }

  async loadLanguage(lang) {
    this.currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* storage unavailable */ }
    document.documentElement.lang = lang;
    try {
      const res = await fetch(`./data/locales/${lang}.json`);
      this.translations = await res.json();
    } catch (e) {
      console.error('Localization loading error:', e);
    }
  }

  t(keyPath) {
    return keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : keyPath, this.translations);
  }
}

export const i18n = new I18n();

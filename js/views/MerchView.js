import { i18n } from '../I18n.js';
import { Button } from '../components/Button.js';
import { el } from '../utils/helpers.js';

export class MerchView {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
  }

  async render(parent) {
    this.element.innerHTML = '';
    this.element.appendChild(el('h2', {}, `// ${i18n.t('merch.page_title')}`));

    const grid = el('div', { class: 'merch-grid' });

    const items = await this.app.fetchJSON('./data/merch.json');
    if (!items || !Array.isArray(items)) {
      this.element.appendChild(el('p', { class: 'muted' }, '[ ERROR: failed to load merch data ]'));
      parent.appendChild(this.element);
      return;
    }

    const lang = i18n.currentLang;

    items.forEach(item => {
      const name = item[`name_${lang}`] || item.name_en;
      const desc = item[`description_${lang}`] || item.description_en;

      const card = el('div', { class: 'merch-card' },
        el('div', {},
          el('div', { class: 'merch-code' }, item.code),
          el('div', { class: 'merch-title' }, name),
          el('div', { class: 'merch-desc' }, desc)
        ),
        el('div', { class: 'merch-bottom' },
          el('span', { class: 'merch-price' }, `${item.price.toFixed(2)} ${i18n.t('merch.currency')}`),
          el('div', { class: 'btn-wrap' })
        )
      );

      const btnLabel = item.available ? i18n.t('merch.buy') : i18n.t('merch.out_of_stock');
      const buyBtn = new Button(btnLabel, () => {
        if (item.available) alert(`Item ${item.code} added to checkout.`);
      });
      if (!item.available) buyBtn.element.classList.add('disabled');
      buyBtn.render(card.querySelector('.btn-wrap'));

      grid.appendChild(card);
    });

    this.element.appendChild(grid);
    parent.appendChild(this.element);
  }
}

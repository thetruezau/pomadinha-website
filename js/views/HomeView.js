import { Button } from '../components/Button.js';
import { i18n } from '../I18n.js';
import { el } from '../utils/helpers.js';

export class HomeView {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'home-screen-layout';
  }

  async render(parent) {
    this.element.innerHTML = '';

    const config = await this.app.fetchJSON('./data/home.json');
    const shows = await this.app.fetchJSON('./data/shows.json');
    const blocks = config?.blocks || [];

    const mainCol = el('div', { class: 'home-main-col' });
    const sideCol = el('div', { class: 'home-side-col' });
    let hasSide = false;

    for (const block of blocks) {
      const column = block.column === 'side' ? 'side' : 'main';
      const container = column === 'side' ? sideCol : mainCol;

      if (column === 'side') hasSide = true;

      const node = await this.renderBlock(block, shows);
      if (node) container.appendChild(node);
    }

    this.element.appendChild(mainCol);
    if (hasSide) this.element.appendChild(sideCol);
    parent.appendChild(this.element);
  }

  async renderBlock(block, shows) {
    switch (block.type) {
      case 'ticker':  return this.renderTicker(block);
      case 'hero':    return this.renderHero(block);
      case 'news':    return this.renderNews(block);
      case 'shows':   return this.renderShowsWidget(block, shows);
      case 'text':    return this.renderText(block);
      default:        return null;
    }
  }

  renderTicker() {
    const text = i18n.t('home.ticker');
    return el('div', { class: 'ticker', 'aria-hidden': 'true' },
      el('div', { class: 'ticker-track' },
        el('span', {}, ` ${text} `),
        el('span', {}, ` ${text} `)
      )
    );
  }

  renderHero(block) {
    if (!block.src) return null;
    return el('div', { class: 'home-hero-image-wrapper' },
      el('img', {
        src: block.src,
        alt: block.alt || 'Pomadinha live transmission',
        class: 'home-hero-img',
        loading: 'lazy'
      }),
      block.caption ? el('div', { class: 'img-caption' }, `> ${block.caption}`) : null
    );
  }

  renderNews(block) {
    const featuredId = block.featured_album || (this.app.albums[0] && this.app.albums[0].id);
    const box = el('div', { class: 'news-banner-box' },
      el('div', { class: 'news-badge' }, `[ ${i18n.t('home.news_tag')} ]`),
      el('h2', { class: 'news-title' }, block.title || 'TRANSMISSION'),
      el('p', { class: 'news-desc' }, i18n.t('home.news_desc')),
      el('div', { class: 'cta-wrapper' })
    );

    const playBtn = new Button(`[ > ] ${i18n.t('home.featured_album')}`, () => {
      this.app.playAlbum(featuredId);
      this.app.navigate('player');
    });
    playBtn.render(box.querySelector('.cta-wrapper'));

    return box;
  }

  renderShowsWidget(block, shows) {
    const now = new Date();
    const maxItems = block.max_items || 5;

    const upcoming = shows
      .filter(s => new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, maxItems);

    const past = shows
      .filter(s => new Date(s.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, maxItems);

    const items = upcoming.length > 0 ? upcoming : past;
    const titleKey = upcoming.length > 0 ? 'home.shows_title' : 'home.past_shows_title';

    const container = el('div', {});
    container.appendChild(el('h3', {}, `// ${i18n.t(titleKey)}`));

    if (items.length === 0) {
      container.appendChild(el('p', { class: 'muted' }, i18n.t('home.no_shows')));
      return container;
    }

    items.forEach(show => {
      container.appendChild(el('div', { class: 'show-widget-card' },
        el('div', { class: 'show-date' }, show.date),
        el('div', { class: 'show-name' }, show.name),
        el('div', { class: 'show-venue' }, `${show.venue} (${show.city})`)
      ));
    });

    if (block.show_all_link && upcoming.length > 0) {
      const allBtn = new Button(`[ ... ] ${i18n.t('home.all_shows')}`, () => this.app.navigate('shows'));
      allBtn.render(container);
    }

    return container;
  }

  renderText(block) {
    if (!block.content) return null;
    return el('div', { class: 'news-banner-box' },
      el('p', { class: 'news-desc' }, block.content)
    );
  }
}

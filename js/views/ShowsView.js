import { i18n } from '../I18n.js';
import { Button } from '../components/Button.js';
import { el } from '../utils/helpers.js';

export class ShowsView {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
  }

  buildRow(show) {
    const row = el('div', { class: 'show-row' },
      el('span', { class: 'show-date' }, show.date),
      el('span', { class: 'show-details' },
        el('strong', {}, show.name),
        el('small', {}, `${show.venue} (${show.city})`)
      ),
      el('div', { class: 'show-action' })
    );

    const isAvail = show.status === 'available';
    const btn = new Button(isAvail ? i18n.t('shows.tickets') : i18n.t('shows.sold_out'), () => {
      if (isAvail && show.ticketUrl) window.open(show.ticketUrl, '_blank', 'noopener');
    });
    if (!isAvail) btn.element.classList.add('disabled');
    btn.render(row.querySelector('.show-action'));

    return row;
  }

  async render(parent) {
    this.element.innerHTML = '';
    this.element.appendChild(el('h2', {}, `// ${i18n.t('shows.page_title')}`));

    const shows = await this.app.fetchJSON('./data/shows.json');
    if (!shows || !Array.isArray(shows)) {
      this.element.appendChild(el('p', { class: 'muted' }, '[ ERROR: failed to load shows data ]'));
      parent.appendChild(this.element);
      return;
    }

    const now = new Date();

    const upcoming = shows
      .filter(s => new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = shows
      .filter(s => new Date(s.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const upcomingSection = el('div', { class: 'shows-full-list' },
      el('h3', { class: 'list-section-title' }, i18n.t('home.shows_title'))
    );
    const pastSection = el('div', { class: 'shows-full-list' },
      el('h3', { class: 'list-section-title' }, i18n.t('home.past_shows_title'))
    );

    if (upcoming.length === 0) {
      upcomingSection.appendChild(el('p', { class: 'muted' }, i18n.t('home.no_shows')));
    } else {
      upcoming.forEach(s => upcomingSection.appendChild(this.buildRow(s)));
    }

    past.forEach(s => pastSection.appendChild(this.buildRow(s)));

    this.element.appendChild(upcomingSection);
    if (past.length > 0) this.element.appendChild(pastSection);
    parent.appendChild(this.element);
  }
}

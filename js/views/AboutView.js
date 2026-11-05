import { i18n } from '../I18n.js';
import { el } from '../utils/helpers.js';

export class AboutView {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'about-layout';
  }

  async render(parent) {
    this.element.innerHTML = '';

    const data = await this.app.fetchJSON(`./data/about.${i18n.currentLang}.json`);
    if (!data) {
      this.element.appendChild(el('p', { class: 'muted' }, '[ ERROR: failed to load about data ]'));
      parent.appendChild(this.element);
      return;
    }

    // ---- Bio column ----------------------------------------------------
    const bioCol = el('div', { class: 'about-col' });
    bioCol.appendChild(el('h2', {}, `// ${i18n.t('about.page_title')}`));

    if (data.members && data.members.length > 0) {
      const memberBox = el('div', { class: 'member-box' });
      data.members.forEach(m => {
        memberBox.appendChild(el('div', { class: 'member-row' },
          el('span', { class: 'member-name' }, m.name),
          el('span', { class: 'member-role' }, m.role || '')
        ));
      });
      bioCol.appendChild(memberBox);
    }

    // Short bio (always visible)
    if (data.bio_short) {
      bioCol.appendChild(el('p', { class: 'bio-text bio-short' }, data.bio_short));
    }

    // Full bio (expandable)
    const fullBio = el('div', { class: 'bio-full collapsed' });
    if (data.bio_full) {
      data.bio_full.split(/\n\s*\n/).forEach(paragraph => {
        if (paragraph.trim()) {
          fullBio.appendChild(el('p', { class: 'bio-text' }, paragraph.trim()));
        }
      });
    }

    const toggleBtn = el('button', {
      class: 'btn bio-toggle',
      type: 'button'
    }, `[ + ] ${i18n.t('about.read_more')}`);

    toggleBtn.addEventListener('click', () => {
      const isCollapsed = fullBio.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed
        ? `[ + ] ${i18n.t('about.read_more')}`
        : `[ - ] ${i18n.t('about.read_less')}`;
    });

    bioCol.appendChild(fullBio);
    if (data.bio_full && data.bio_full.trim()) {
      bioCol.appendChild(toggleBtn);
    }

    // ---- Project column --------------------------------------------------
    const projectCol = el('div', { class: 'about-col about-project' },
      el('h2', {}, `// ${i18n.t('about.project_title')}`)
    );

    if (data.project) {
      data.project.split(/\n\s*\n/).forEach(paragraph => {
        if (paragraph.trim()) {
          projectCol.appendChild(el('p', { class: 'bio-text' }, paragraph.trim()));
        }
      });
    }

    this.element.append(bioCol, projectCol);
    parent.appendChild(this.element);
  }
}

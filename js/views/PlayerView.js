import { i18n } from '../I18n.js';
import { el } from '../utils/helpers.js';

export class PlayerView {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'player-screen';
    this.trackItems = [];
  }

  async render(parent) {
    this.element.innerHTML = '';

    // Left: artwork frame
    this.artwork = el('div', { class: 'artwork-container' });
    this.element.appendChild(this.artwork);

    // Right: sidebar with album selector + tracklist
    const sidebar = el('div', { class: 'sidebar' });

    const selectorBox = el('div', { class: 'album-selector' },
      el('label', { class: 'track-header' }, i18n.t('player.select_album'))
    );
    this.select = el('select', { class: 'album-dropdown' });
    this.app.albums.forEach(album => {
      const opt = el('option', { value: album.id }, `${album.title} (${album.year})`);
      if (this.app.activeAlbum && album.id === this.app.activeAlbum.id) opt.selected = true;
      this.select.appendChild(opt);
    });
    this.select.addEventListener('change', (e) => {
      this.app.playAlbum(e.target.value);
      this.renderFrame();
      this.renderTracklist();
      this.update();
    });
    selectorBox.appendChild(this.select);
    sidebar.appendChild(selectorBox);

    this.tracklistContainer = el('div', { class: 'track-list' });
    sidebar.appendChild(this.tracklistContainer);

    this.element.appendChild(sidebar);
    parent.appendChild(this.element);

    this.renderFrame();
    this.renderTracklist();
    this.update();
  }

  renderFrame() {
    const album = this.app.activeAlbum;
    this.artwork.innerHTML = `
      <div class="album-frame">
        <div class="album-title">${album ? album.title : 'POMADINHA'}</div>
        <div class="album-center-art"></div>
        <div class="album-meta">${album ? album.year : ''} // TRANSMISSION NETWORK</div>
      </div>
    `;
  }

  renderTracklist() {
    this.tracklistContainer.innerHTML = '';
    this.tracklistContainer.appendChild(
      el('div', { class: 'track-header' }, i18n.t('player.tracks'))
    );
    this.trackItems = [];

    const album = this.app.activeAlbum;
    if (!album) return;

    album.tracks.forEach((track, index) => {
      const ver = this.app.generatedVersions[index];
      const verLabel = (ver && ver !== 'default') ? `${i18n.t('player.version')} ${ver}` : '';

      const item = el('div', {
        class: `track-item ${index === this.app.currentTrackIndex ? 'active' : ''}`
      },
        el('div', {},
          el('span', { class: 'track-num' }, String(track.number).padStart(2, '0')),
          el('span', {}, track.title)
        ),
        el('span', { class: 'track-ver' }, verLabel)
      );

      item.addEventListener('click', () => this.app.selectTrack(index));

      this.trackItems.push(item);
      this.tracklistContainer.appendChild(item);
    });
  }

  update() {
    if (!this.trackItems) return;
    this.trackItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === this.app.currentTrackIndex);
    });
    // Keep dropdown in sync when album changes elsewhere
    if (this.select && this.app.activeAlbum && this.select.value !== this.app.activeAlbum.id) {
      this.select.value = this.app.activeAlbum.id;
      this.renderFrame();
      this.renderTracklist();
    }
  }
}

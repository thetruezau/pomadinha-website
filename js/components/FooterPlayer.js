import { Button } from './Button.js';
import { i18n } from '../I18n.js';
import { formatTime, el } from '../utils/helpers.js';

export class FooterPlayer {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'global-footer-player';
    this.setupUI();
  }

  setupUI() {
    this.element.innerHTML = '';

    this.progressBar = el('div', {
      class: 'footer-progress-bar',
      role: 'progressbar',
      'aria-label': 'seek',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '0'
    }, el('div', { class: 'footer-progress-fill' }));

    this.progressFill = this.progressBar.firstChild;

    this.trackTitle = el('span', { class: 'footer-track-title' }, '--');
    this.trackMeta = el('span', { class: 'footer-track-meta' }, '--');
    this.timeDisplay = el('div', { class: 'footer-time' }, '0:00 / 0:00');
    this.controlsBox = el('div', { class: 'footer-controls' });
    this.themeDisplay = el('div', { class: 'footer-theme' }, '');

    this.progressBar.addEventListener('click', (e) => {
      if (!this.app.audio || !this.app.audio.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.app.audio.currentTime = clickRatio * this.app.audio.duration;
    });

    // Controls
    new Button('[ << ]', () => this.app.prevTrack()).render(this.controlsBox);
    this.playBtn = new Button('[ > ]', () => this.app.togglePlay());
    this.playBtn.render(this.controlsBox);
    new Button('[ >> ]', () => this.app.nextTrack()).render(this.controlsBox);

    this.element.append(
      this.progressBar,
      el('div', { class: 'footer-content' },
        el('div', { class: 'footer-info' }, this.trackTitle, this.trackMeta),
        this.controlsBox,
        this.timeDisplay,
        this.themeDisplay
      )
    );
  }

  update() {
    if (!this.app.activeAlbum) return;

    const track = this.app.activeAlbum.tracks[this.app.currentTrackIndex];
    if (!track) return;

    const currentTime = this.app.audio.currentTime || 0;
    const duration = this.app.audio.duration || 0;

    // Sequence code: the A/B draw for this playback
    const seq = this.app.generatedVersions
      .map(v => (v === 'default' ? '-' : v))
      .join('-');

    this.trackTitle.textContent = `${i18n.t('footer.now_playing')}: ${track.number}. ${track.title}`;
    this.trackMeta.textContent = `${this.app.activeAlbum.title} (${this.app.activeAlbum.artist}) :: ${i18n.t('footer.sequence')} [${seq}]`;

    const ratio = duration > 0 ? (currentTime / duration) * 100 : 0;
    this.progressFill.style.width = `${Math.min(ratio, 100)}%`;
    this.progressBar.setAttribute('aria-valuenow', String(Math.round(ratio)));
    this.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

    this.playBtn.element.textContent = this.app.isPlaying ? '[ || ]' : '[ > ]';

    // Show active palette name
    if (this.app.currentPalette) {
      this.themeDisplay.textContent = `[ ${i18n.t('footer.theme')}: ${this.app.currentPalette.name} ]`;
    }
  }

  render(parent) {
    parent.appendChild(this.element);
  }
}

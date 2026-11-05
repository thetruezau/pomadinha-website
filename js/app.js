import { i18n } from './I18n.js';
import { Header } from './components/Header.js';
import { FooterPlayer } from './components/FooterPlayer.js';
import { HomeView } from './views/HomeView.js';
import { MerchView } from './views/MerchView.js';
import { ShowsView } from './views/ShowsView.js';
import { PlayerView } from './views/PlayerView.js';
import { AboutView } from './views/AboutView.js';
import { GalleryView } from './views/GalleryView.js';

// ---------------------------------------------------------------------------
// Route table: one line per page. Add a view here and it appears everywhere.
// ---------------------------------------------------------------------------
const ROUTES = {
  home:    { view: HomeView,    title: 'POMADINHA --- Transmission Network' },
  about:   { view: AboutView,   title: 'POMADINHA --- About' },
  shows:   { view: ShowsView,   title: 'POMADINHA --- Shows' },
  merch:   { view: MerchView,   title: 'POMADINHA --- Merch' },
  player:  { view: PlayerView,  title: 'POMADINHA --- Songs' },
  gallery: { view: GalleryView, title: 'POMADINHA --- Gallery' }
};
const DEFAULT_ROUTE = 'home';

class App {
  constructor() {
    this.root = document.getElementById('app');
    this.cache = new Map();

    // Router state
    this.currentRoute = DEFAULT_ROUTE;

    // Global player state
    this.albums = [];
    this.activeAlbum = null;
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.generatedVersions = [];

    // Anti-spam / transition lock for fast audio switching
    this.isTransitioning = false;
    this.debounceTimer = null;

    // Colour palette state
    this.currentPalette = null;

    // Audio element + events
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.setupAudioEvents();
    this.setupKeyboard();

    this.init();
  }

  // -------------------------------------------------------------------------
  // Audio events — drive all UI updates from native events, no rAF loop.
  // -------------------------------------------------------------------------
  setupAudioEvents() {
    this.audio.addEventListener('ended', () => this.nextTrack());

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio file failed to load:', e);
      this.isTransitioning = false;
      if (this.audio.src) this.nextTrack();
    });

    const syncUI = () => {
      if (this.footerPlayer) this.footerPlayer.update();
      if (this.views && this.views.player) this.views.player.update();
      this.updateMediaSession();
    };

    ['play', 'pause', 'timeupdate', 'durationchange', 'loadedmetadata']
      .forEach(evt => this.audio.addEventListener(evt, syncUI));
  }

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const tag = e.target.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Space: play / pause (unless typing)
      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        this.togglePlay();
        return;
      }

      // Alt + Left Arrow: previous track
      if (e.code === 'ArrowLeft' && e.altKey && !isTyping) {
        e.preventDefault();
        this.prevTrack();
        return;
      }

      // Alt + Right Arrow: next track
      if (e.code === 'ArrowRight' && e.altKey && !isTyping) {
        e.preventDefault();
        this.nextTrack();
        return;
      }
    });
  }

  // -------------------------------------------------------------------------
  // Media Session API — connects to browser media keys / OS media controls
  // -------------------------------------------------------------------------
  updateMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const album = this.activeAlbum;
    const track = album?.tracks?.[this.currentTrackIndex];
    if (!track) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: album.artist || 'POMADINHA',
        album: album.title
      });

      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play',  () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack',     () => this.nextTrack());
    } catch (e) {
      // MediaSession may be restricted in some contexts
    }
  }

  // -------------------------------------------------------------------------
  // Colour Palette — random on every load
  // -------------------------------------------------------------------------
  async loadPalette() {
    try {
      const paletteFiles = await this.fetchJSON('./data/colours/index.json');
      if (!Array.isArray(paletteFiles) || paletteFiles.length === 0) return;

      const pick = paletteFiles[Math.floor(Math.random() * paletteFiles.length)];
      const palette = await this.fetchJSON(`./data/colours/${pick}`);

      if (palette && palette.vars) {
        this.currentPalette = palette;
        const css = Object.entries(palette.vars)
          .map(([k, v]) => `${k}: ${v};`)
          .join(' ');

        let styleTag = document.getElementById('palette-inject');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'palette-inject';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = `:root { ${css} }`;
      }
    } catch (e) {
      console.warn('Failed to load colour palette:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  async init() {
    await this.loadPalette();
    await i18n.loadLanguage(i18n.currentLang);
    this.albums = await this.fetchJSON('./data/albums.json');

    if (this.albums.length > 0) {
      this.loadAlbum(this.albums[0].id, false);
    }

    this.buildSkeleton();

    window.addEventListener('hashchange', () => this.renderCurrentRoute());
    await this.renderCurrentRoute();
  }

  async fetchJSON(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.cache.set(url, data);
      return data;
    } catch (e) {
      console.error(`Failed to load ${url}:`, e);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Routing
  // -------------------------------------------------------------------------
  routeFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    return ROUTES[hash] ? hash : DEFAULT_ROUTE;
  }

  navigate(route) {
    if (!ROUTES[route]) route = DEFAULT_ROUTE;
    const targetHash = `#/${route === DEFAULT_ROUTE ? '' : route}`;
    if (window.location.hash === targetHash || (route === DEFAULT_ROUTE && !window.location.hash)) {
      this.renderCurrentRoute();
    } else {
      window.location.hash = targetHash;
    }
  }

  async renderCurrentRoute() {
    this.currentRoute = this.routeFromHash();
    document.title = ROUTES[this.currentRoute].title;

    this.header.render(this.headerContainer);
    this.mainContainer.innerHTML = '';

    const view = this.views[this.currentRoute];
    try {
      await view.render(this.mainContainer);
    } catch (e) {
      console.error(`Failed to render route "${this.currentRoute}":`, e);
      this.mainContainer.innerHTML = `<p class="muted">[ ERROR: failed to load ${this.currentRoute.toUpperCase()} ]</p>`;
    }
  }

  async setLanguage(lang) {
    await i18n.loadLanguage(lang);
    this.footerPlayer.setupUI();
    this.footerPlayer.update();
    await this.renderCurrentRoute();
  }

  // -------------------------------------------------------------------------
  // Audio engine
  // -------------------------------------------------------------------------
  loadAlbum(albumId, autoPlay = true) {
    this.activeAlbum = this.albums.find(a => a.id === albumId) || this.albums[0];
    if (!this.activeAlbum) return;
    this.currentTrackIndex = 0;

    // Smart A/B version draw ('default' for single-version tracks)
    this.generatedVersions = this.activeAlbum.tracks.map(track => {
      if (track.versions && Object.keys(track.versions).length > 0) {
        const availableKeys = Object.keys(track.versions);
        return availableKeys[Math.floor(Math.random() * availableKeys.length)];
      }
      return 'default';
    });

    this.isPlaying = autoPlay;
    this.loadAudioFile();
    this.updateMediaSession();
  }

  loadAudioFile() {
    if (!this.activeAlbum) return;
    const track = this.activeAlbum.tracks[this.currentTrackIndex];
    if (!track) return;

    const versionKey = this.generatedVersions[this.currentTrackIndex];
    let audioPath = '';

    if (versionKey !== 'default' && track.versions) {
      audioPath = track.versions[versionKey];
    } else {
      audioPath = track.file;
    }

    if (!audioPath) return;

    this.audio.pause();
    this.audio.src = audioPath;
    this.audio.load();

    if (this.isPlaying) {
      this.isTransitioning = true;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => { this.isTransitioning = false; })
          .catch(err => {
            console.warn('Playback interrupted or blocked by the browser:', err);
            this.isPlaying = false;
            this.isTransitioning = false;
          });
      }
    } else {
      this.isTransitioning = false;
    }
  }

  executeAudioControl(action) {
    if (this.isTransitioning) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(action, 150);
  }

  playAlbum(albumId) {
    this.executeAudioControl(() => this.loadAlbum(albumId, true));
  }

  selectTrack(index) {
    if (this.currentTrackIndex === index && this.isPlaying) return;

    this.executeAudioControl(() => {
      this.currentTrackIndex = index;
      this.isPlaying = true;
      this.loadAudioFile();
      this.updateMediaSession();
    });
  }

  togglePlay() {
    this.executeAudioControl(() => {
      if (!this.audio.src) {
        this.loadAudioFile();
      }

      if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
      } else {
        this.isPlaying = true;
        this.audio.play().catch(err => {
          console.warn('Failed to start audio:', err);
          this.isPlaying = false;
        });
      }
      this.updateMediaSession();
    });
  }

  nextTrack() {
    if (!this.activeAlbum) return;
    this.executeAudioControl(() => {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.activeAlbum.tracks.length;
      this.loadAudioFile();
      this.updateMediaSession();
    });
  }

  prevTrack() {
    if (!this.activeAlbum) return;
    this.executeAudioControl(() => {
      const count = this.activeAlbum.tracks.length;
      this.currentTrackIndex = (this.currentTrackIndex - 1 + count) % count;
      this.loadAudioFile();
      this.updateMediaSession();
    });
  }

  // -------------------------------------------------------------------------
  // Skeleton
  // -------------------------------------------------------------------------
  buildSkeleton() {
    this.root.innerHTML = '';

    this.headerContainer = document.createElement('div');
    this.mainContainer = document.createElement('main');
    this.mainContainer.className = 'content-area';
    this.footerContainer = document.createElement('div');

    this.root.append(this.headerContainer, this.mainContainer, this.footerContainer);

    this.header = new Header(this);
    this.footerPlayer = new FooterPlayer(this);
    this.footerPlayer.render(this.footerContainer);
    this.footerPlayer.update();

    this.views = {};
    for (const [route, config] of Object.entries(ROUTES)) {
      this.views[route] = new config.view(this);
    }
  }
}

new App();

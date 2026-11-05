import { i18n } from '../I18n.js';
import { el } from '../utils/helpers.js';

export class GalleryView {
    constructor(app) {
	this.app = app;
	this.element = document.createElement('div');
    }

    async render(parent) {
	this.element.innerHTML = '';
	this.element.appendChild(el('h2', {}, `// ${i18n.t('gallery.page_title')}`));

	const config = await this.app.fetchJSON('./data/gallery.json');
	if (!config) {
	    this.element.appendChild(el('p', { class: 'muted' }, '[ ERROR: failed to load gallery config ]'));
	    parent.appendChild(this.element);
	    return;
	}

	const folderId = (config.folderId || '').trim();
	console.log(folderId);
	const hasRealFolder = folderId && !folderId.toLowerCase().includes('paste');

	// ------------------------------------------------------------------
	// Mode "drive": embed a public Google Drive folder.
	// ------------------------------------------------------------------
	if (config.mode === 'drive' && hasRealFolder) {
	    const frame = el('iframe', {
		class: 'drive-frame',
		src: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
		loading: 'lazy',
		allowfullscreen: 'true'
	    });

	    const wrap = el('div', { class: 'drive-wrap' }, frame);
	    wrap.appendChild(el('div', { class: 'drive-footer-note' },
				el('a', {
				    class: 'drive-open-link',
				    href: `https://drive.google.com/drive/folders/${folderId}`,
				    target: '_blank',
				    rel: 'noopener'
				}, `[ ${i18n.t('gallery.open_drive')} ]`)
			       ));

	    this.element.appendChild(wrap);
	    parent.appendChild(this.element);
	    return;
	}

	// ------------------------------------------------------------------
	// Mode "custom": grid from photo entries.
	// ------------------------------------------------------------------
	const grid = el('div', { class: 'gallery-grid' });
	const photos = config.photos || [];

	photos.forEach(photo => {
	    const fig = el('figure', { class: 'gallery-item' },
			   el('a', { href: photo.src, target: '_blank', rel: 'noopener' },
			      el('img', { src: photo.src, alt: photo.caption || 'Pomadinha photo', loading: 'lazy' })
			     )
			  );
	    if (photo.caption) fig.appendChild(el('figcaption', {}, `> ${photo.caption}`));
	    grid.appendChild(fig);
	});

	if (photos.length === 0) {
	    grid.appendChild(el('p', { class: 'muted' }, i18n.t('gallery.empty')));
	}

	this.element.appendChild(grid);
	parent.appendChild(this.element);
    }
}

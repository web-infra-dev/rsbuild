import { registerOverlay } from './hmr';

const {
  HTMLElement = class {} as typeof globalThis.HTMLElement,
  customElements,
} = typeof window !== 'undefined' ? window : globalThis;

class ErrorOverlay extends HTMLElement {
  constructor(html: string) {
    super();

    if (!this.attachShadow) {
      console.warn(
        '[Rsbuild] Current browser version does not support displaying error overlay',
      );
      return;
    }

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = html;

    root.querySelector('.close')?.addEventListener('click', this.close);
    // close overlay when click outside
    this.addEventListener('click', this.close);
    root.querySelector('.container')?.addEventListener('click', (e) => {
      if (e.target) {
        const { file } = (e.target as HTMLLinkElement).dataset;
        if (file) {
          fetch(`/__open-in-editor?file=${encodeURIComponent(file)}`);
        }
      }
      e.stopPropagation();
    });

    const onEscKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.close();
      }
      document.removeEventListener('keydown', onEscKeydown);
    };
    document.addEventListener('keydown', onEscKeydown);
  }

  close = (immediate: unknown = false) => {
    const remove = () => this.parentNode?.removeChild(this);

    if (this.animate && immediate !== true) {
      this.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        easing: 'ease-out',
      }).addEventListener('finish', remove);
    } else {
      remove();
    }
  };
}

const overlayId = 'rsbuild-error-overlay';

if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay);
}

function createOverlay(html: string) {
  clearOverlay();
  document.body.appendChild(new ErrorOverlay(html));
}

function clearOverlay() {
  // use NodeList's forEach api instead of dom.iterable
  document
    .querySelectorAll<ErrorOverlay>(overlayId)
    // close overlay immediately to avoid multiple overlays at the same time
    .forEach((n) => {
      n.close(true);
    });
}

if (typeof document !== 'undefined') {
  registerOverlay(createOverlay, clearOverlay);
} else {
  console.info(
    '[Rsbuild] Failed to display error overlay as document is not available, you can disable the `dev.client.overlay` option.',
  );
}

import { registerOverlay } from './hmr';

function linkedText(root: ShadowRoot, selector: string, text: string): void {
  const el = root.querySelector(selector)!;
  const fileRegex = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;

  let curIndex = 0;
  let match = fileRegex.exec(text);
  while (match !== null) {
    const { 0: file, index } = match;
    if (index != null) {
      const frag = text.slice(curIndex, index);
      el.insertAdjacentHTML('beforeend', frag);
      const link = document.createElement('a');
      link.textContent = file;
      link.className = 'file-link';

      link.onclick = () => {
        fetch(`/__open-in-editor?file=${encodeURIComponent(file)}`);
      };
      el.appendChild(link);
      curIndex += frag.length + file.length;
    }
    match = fileRegex.exec(text);
  }

  const frag = text.slice(curIndex);
  el.insertAdjacentHTML('beforeend', frag);
}

const {
  HTMLElement = class {} as typeof globalThis.HTMLElement,
  customElements,
} = typeof window !== 'undefined' ? window : globalThis;

class ErrorOverlay extends HTMLElement {
  constructor(overlay: string, errors: string[]) {
    super();

    if (!this.attachShadow) {
      console.warn(
        '[Rsbuild] Current browser version does not support displaying error overlay',
      );
      return;
    }

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = overlay;

    linkedText(root, '.content', errors.join('\n\n').trim());
    root.querySelector('.close')?.addEventListener('click', this.close);
    // close overlay when click outside
    this.addEventListener('click', this.close);
    root.querySelector('.container')!.addEventListener('click', (e) => {
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

  close = () => {
    const remove = () => this.parentNode?.removeChild(this);

    if (this.animate) {
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

function createOverlay(overlay: string, errors: string[]) {
  clearOverlay();
  document.body.appendChild(new ErrorOverlay(overlay, errors));
}

function clearOverlay() {
  // use NodeList's forEach api instead of dom.iterable
  // biome-ignore lint/complexity/noForEach: <explanation>
  document.querySelectorAll<ErrorOverlay>(overlayId).forEach((n) => n.close());
}

if (typeof document !== 'undefined') {
  registerOverlay(createOverlay, clearOverlay);
} else {
  console.info(
    '[Rsbuild] Failed to display error overlay as document is not available, you can disable the `dev.client.overlay` option.',
  );
}

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

const overlayTemplate = `
<style>
.root {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  cursor: pointer;
}
.container {
  font-family: Menlo, Consolas, monospace;
  line-height: 1.6;
  width: 960px;
  max-width: 85%;
  color: #d8d8d8;
  margin: 32px auto;
  padding: 32px 40px;
  position: relative;
  background: #181818;
  border-radius: 24px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  direction: ltr;
  text-align: left;
  box-sizing: border-box;
  cursor: default;
}
.title {
  margin: 0 0 20px;
  padding-bottom: 12px;
  font-size: 17px;
  font-weight: 600;
  color: #fb6a6a;
  border-bottom: 2px solid rgba(252,94,94,.66);
}
.content {
  margin: 0;
  font-size: 14px;
  font-family: inherit;
  overflow-x: scroll;
  scrollbar-width: none;
}
.content::-webkit-scrollbar {
  display: none;
}
.file-link {
  cursor: pointer;
  color: #6eecf7;
  text-decoration: underline;
  text-underline-offset: 3px;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}
.close {
  position: absolute;
  top: 27px;
  right: 32px;
  width: 32px;
  height: 32px;
  cursor: pointer;
}
.close:hover {
  opacity: 0.8;
}
.close:active {
  opacity: 0.6;
}
.close:before,
.close:after {
  position: absolute;
  left: 16px;
  top: 8px;
  content: ' ';
  height: 18px;
  width: 2px;
  border-radius: 4px;
  background-color: #b8b8b8;
}
.close:before {
  transform: rotate(45deg);
}
.close:after {
  transform: rotate(-45deg);
}
.footer {
  font-size: 12px;
  color: #7e6a92;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 2px solid rgba(126,106,146,.6);
}
.footer p {
  margin: 4px 0 0;
}
.footer span {
  color: #a88dc3;
}
</style>

<div class="root">
  <div class="container">
    <div class="close"></div>
    <p class="title">Build failed</p>
    <pre class="content"></pre>
    <footer class="footer">
      <p><span>Fix error</span>, click outside, or press Esc to close the overlay.</p>
      <p>Disable overlay by setting Rsbuild's <span>dev.client.overlay</span> config to false.<p>
    </footer>
  </div>
</div>
`;

const {
  HTMLElement = class {} as typeof globalThis.HTMLElement,
  customElements,
} = typeof window !== 'undefined' ? window : globalThis;

class ErrorOverlay extends HTMLElement {
  constructor(message: string[]) {
    super();

    if (!this.attachShadow) {
      console.warn(
        '[Rsbuild] Current browser version does not support displaying error overlay',
      );
      return;
    }

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = overlayTemplate;

    linkedText(root, '.content', message.join('\n\n').trim());

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

function createOverlay(err: string[]) {
  clearOverlay();
  document.body.appendChild(new ErrorOverlay(err));
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

function stripAnsi(content: string) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  const regex = new RegExp(pattern, 'g');

  return content.replace(regex, '');
}

function linkedText(root: ShadowRoot, selector: string, text: string): void {
  const el = root.querySelector(selector)!;
  const fileRegex = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;

  let curIndex = 0;
  let match = fileRegex.exec(text);
  while (match !== null) {
    const { 0: file, index } = match;
    if (index != null) {
      const frag = text.slice(curIndex, index);
      el.appendChild(document.createTextNode(frag));
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
  el.appendChild(document.createTextNode(frag));
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
  width: 800px;
  max-width: 85%;
  color: #d8d8d8;
  margin: 32px auto;
  padding: 32px 40px 42px;
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
  color: #fc5e5e;
  border-bottom: 2px solid rgba(252, 94, 94, 0.7);
}

.content {
  margin: 0;
  font-size: 14px;
  font-family: inherit;
  overflow-x: scroll;
  scrollbar-width: none;
  color: #b8b8b8;
}
.content::-webkit-scrollbar {
  display: none;
}

.file-link {
  cursor: pointer;
  color: #27caca;
  text-decoration: underline;

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
</style>

<div class="root">
  <div class="container">
    <div class="close"></div>
    <p class="title">Compilation failed</p>
    <pre class="content"></pre>
  </div>
</div>
`;

const {
  HTMLElement = class {} as typeof globalThis.HTMLElement,
  customElements,
} = globalThis;

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

    linkedText(root, '.content', stripAnsi(message.join('/n')).trim());

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
    this.parentNode?.removeChild(this);
  };
}

const overlayId = 'rsbuild-error-overlay';

if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay);
}

const documentAvailable = typeof document !== 'undefined';

export function createOverlay(err: string[]) {
  if (!documentAvailable) {
    console.info(
      '[Rsbuild] Failed to display error overlay as document is not available, you can disable the `dev.client.overlay` option.',
    );
    return;
  }

  clearOverlay();
  document.body.appendChild(new ErrorOverlay(err));
}

export function clearOverlay() {
  if (!documentAvailable) {
    return;
  }

  // use NodeList's forEach api instead of dom.iterable
  // biome-ignore lint/complexity/noForEach: <explanation>
  document.querySelectorAll<ErrorOverlay>(overlayId).forEach((n) => n.close());
}

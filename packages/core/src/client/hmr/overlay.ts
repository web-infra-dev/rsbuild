interface ErrorPayload {
  type: 'error';
  err: string[];
}

const template = /*html*/ `
<style>
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  --monospace: 'SFMono-Regular', Consolas,
  'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --window-background: #181818;
  --window-color: #d8d8d8;
}

.backdrop {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 40%;
  color: var(--window-color);
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: var(--window-background);
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.title {
  color: var(--red);
}
.message-body {
  color: var(--window-color);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
  color: rgb(0, 187, 187);
}

.close {
  line-height: 1rem;
  font-size: 1.5rem;
  padding: 1rem;
  cursor: pointer;
  position: absolute;
  right: 0px;
  top: 0px;
  background-color: transparent;
  border: none;
}
</style>
<div class="backdrop" part="backdrop">
  <div class="window" part="window">
    <div class="close">x</div>
    <p class="title">Compile error:</p>
    <pre class="message" part="message"><span class="message-body" part="message-body"></span></pre>
  </div>
</div>
`;

function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

const regex = ansiRegex();

function stripAnsi(content: string) {
  if (typeof content !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof content}\``);
  }

  return content.replace(regex, '');
}

const fileRE = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;

// Allow `ErrorOverlay` to extend `HTMLElement` even in environments where
// `HTMLElement` was not originally defined.
const { HTMLElement = class {} as typeof globalThis.HTMLElement } = globalThis;

export class ErrorOverlay extends HTMLElement {
  root: ShadowRoot;
  closeOnEsc: (e: KeyboardEvent) => void;

  constructor(message: ErrorPayload['err']) {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = template;

    this.linkedText('.message-body', stripAnsi(message.join('/n')).trim());

    this.root.querySelector('.window')!.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.root.querySelector('.close')!.addEventListener('click', () => {
      this.close();
    });

    this.addEventListener('click', () => {
      this.close();
    });

    this.closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.close();
      }
    };

    document.addEventListener('keydown', this.closeOnEsc);
  }

  linkedText(selector: string, text: string): void {
    const el = this.root.querySelector(selector)!;
    
    let curIndex = 0;
    let match: RegExpExecArray | null;
    fileRE.lastIndex = 0;
    while ((match = fileRE.exec(text))) {
      const { 0: file, index } = match;
      if (index != null) {
        const frag = text.slice(curIndex, index);
        el.appendChild(document.createTextNode(frag));
        const link = document.createElement('a');
        link.textContent = file;
        link.className = 'file-link';

        link.onclick = () => {
          fetch(
              `/__open-in-editor?file=${encodeURIComponent(file)}`,
          );
        };
        el.appendChild(link);
        curIndex += frag.length + file.length;
      }
    }

    const frag = text.slice(curIndex);
    el.appendChild(document.createTextNode(frag));
  }

  close(): void {
    this.parentNode?.removeChild(this);
    document.removeEventListener('keydown', this.closeOnEsc);
  }
}

export const overlayId = 'rsbuild-error-overlay';

const { customElements } = globalThis;
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay);
}

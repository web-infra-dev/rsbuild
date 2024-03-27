const template = `
<style>
.root {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
}

.content {
  line-height: 1.5;
  width: 40%;
  color: #d8d8d8;
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: #181818;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  direction: ltr;
  text-align: left;
}

.title {
  font-weight: 600;
  color: #ff5555;
}

pre {
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
  white-space: pre-wrap;
  color: #d8d8d8;
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
  color: rgb(92 157 255);
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
<div class="root">
  <div class="content">
    <div class="close">x</div>
    <p class="title">Compile error:</p>
    <pre class="message"></pre>
  </div>
</div>
`;

function ansiRegex() {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  return new RegExp(pattern, 'g');
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

class ErrorOverlay extends HTMLElement {
  root: ShadowRoot;

  constructor(message: string[]) {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = template;

    linkedText(this.root, '.message', stripAnsi(message.join('/n')).trim());

    this.root.querySelector('.close')!.addEventListener('click', () => {
      this.close();
    });

    // close overlay when click outside
    this.addEventListener('click', () => {
      this.close();
    });

    this.root.querySelector('.content')!.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  close(): void {
    this.parentNode?.removeChild(this);
  }
}

const overlayId = 'rsbuild-error-overlay';

const { customElements } = globalThis;
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay);
}

function linkedText(root: ShadowRoot, selector: string, text: string): void {
  const el = root.querySelector(selector)!;

  let curIndex = 0;
  let match: RegExpExecArray | null = fileRE.exec(text);
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
    match = fileRE.exec(text)
  }

  const frag = text.slice(curIndex);
  el.appendChild(document.createTextNode(frag));
}

export function createOverlay(err: any) {
  clearOverlay();
  document.body.appendChild(new ErrorOverlay(err));
}

export function clearOverlay() {
  // use NodeList's forEach api instead of dom.iterable
  // biome-ignore lint/complexity/noForEach: <explanation>
  document.querySelectorAll<ErrorOverlay>(overlayId).forEach((n) => n.close());
}

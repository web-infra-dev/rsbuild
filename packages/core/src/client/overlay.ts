import type { OverlayError } from '../types';
import { formatRuntimeErrors } from './format';
import { registerOverlay } from './hmr';

function stripAnsi(content: string) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  const regex = new RegExp(pattern, 'g');

  return content.replace(regex, '');
}

function displayElement(el: Element) {
  (el as HTMLElement).style.display = 'block';
}

function linkedText(root: ShadowRoot, selector: string, text: string): void {
  const el = root.querySelector(selector)!;
  displayElement(el);
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

function updateLink(root: ShadowRoot, selector: string, file: string): void {
  const el = root.querySelector(selector)!;
  el.addEventListener('click', () => {
    fetch(`/__open-in-editor?file=${encodeURIComponent(file)}`);
  });
  el.classList.add('cursor-pointer');
}

function updateElement(
  root: ShadowRoot,
  selector: string,
  innerHTML: string,
): void {
  const el = root.querySelector(selector)!;
  el.innerHTML = innerHTML;
  displayElement(el);
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
}
.container {
  font-family: Menlo, Consolas, monospace;
  line-height: 1.6;
  width: 800px;
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
  color: #fc5e5e;
  border-bottom: 2px solid rgba(252,94,94,.66);
}
.build-content {
  display: none;
  margin: 0;
  font-size: 14px;
  font-family: inherit;
  overflow-x: scroll;
  scrollbar-width: none;
  color: #b8b8b8;
}
.build-content::-webkit-scrollbar {
  display: none;
}
.runtime-content {
  display: none;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  overflow-x: scroll;
  scrollbar-width: none;
  color: #dacbcb;
  background: rgba(206, 17, 38, 0.1);
  &.cursor-pointer{
    cursor: pointer;
  }
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
  display: none;
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

.stack {
  margin-top: 20px;
  font-size: 12px;
  color: #b8b8b8;
}

.stack pre {
  overflow-x: scroll;
  scrollbar-width: none;
}
</style>

<div class="root">
  <div class="container">
    <div class="close"></div>
    <p class="title"></p>
    <pre class="build-content"></pre>
    <pre class="runtime-content"></pre>
    <footer class="footer"></footer>
    <div class="stack"></div>
  </div>
</div>
`;

const {
  HTMLElement = class {} as typeof globalThis.HTMLElement,
  customElements,
} = typeof window !== 'undefined' ? window : globalThis;

class ErrorOverlay extends HTMLElement {
  constructor(error: OverlayError) {
    super();

    if (!this.attachShadow) {
      console.warn(
        '[Rsbuild] Current browser version does not support displaying error overlay',
      );
      return;
    }

    const { type, content, title, stack, sourceFile } = error;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = overlayTemplate;

    updateElement(root, '.title', title);

    if (type === 'build') {
      linkedText(root, '.build-content', stripAnsi(content).trim());
    } else {
      updateElement(root, '.runtime-content', content);
      if (sourceFile) {
        updateLink(root, '.runtime-content', sourceFile);
      }
    }

    if (stack?.length) {
      updateElement(
        root,
        '.stack',
        `
      <details>
        <summary>${stack.length} stack frames</summary>
        <pre>${stack.join('\n')}</pre>
      </details>
      `,
      );
    }

    updateElement(
      root,
      '.footer',
      type === 'build'
        ? ' <p>This error occurred during the build time and cannot be dismissed.</p>'
        : "<p><span>Fix error</span>, click outside, or press Esc to close the overlay.</p><p>Disable overlay by setting Rsbuild's <span>dev.client.runtimeErrors</span> config to false.<p>",
    );

    if (type === 'runtime') {
      displayElement(root.querySelector('.close') as Element);
      root.querySelector('.close')?.addEventListener('click', this.close);

      const onEscKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.code === 'Escape') {
          this.close();
        }
        document.removeEventListener('keydown', onEscKeydown);
      };

      document.addEventListener('keydown', onEscKeydown);
    }
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

const documentAvailable = typeof document !== 'undefined';

export function createOverlay(err: OverlayError) {
  if (!documentAvailable) {
    console.info(
      '[Rsbuild] Failed to display error overlay as document is not available, you can disable the `dev.client.overlay` option.',
    );
    return;
  }

  if (!err) return;

  if (hasOverlay()) return;

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

export function hasOverlay() {
  if (!documentAvailable) {
    return false;
  }

  return document.querySelector(overlayId) !== null;
}

if (typeof document !== 'undefined') {
  registerOverlay(createOverlay, clearOverlay);
} else {
  console.info(
    '[Rsbuild] Failed to display error overlay as document is not available, you can disable the `dev.client.overlay` option.',
  );
}

const config = RSBUILD_CLIENT_CONFIG;

if (config.overlay.runtimeErrors) {
  window.addEventListener('error', async (event) => {
    const formatted = await formatRuntimeErrors(event, false);
    createOverlay(formatted);
  });

  window.addEventListener('unhandledrejection', async (event) => {
    if (event.reason?.stack) {
      const formatted = await formatRuntimeErrors(event, true);
      createOverlay(formatted);
    }
  });
}

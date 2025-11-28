import path from 'node:path';
import { toRelativePath } from '../helpers/path';
import { ansiHTML } from './ansiHTML';
import { escapeHtml } from './helper';

export function convertLinksInHtml(text: string, root?: string): string {
  /**
   * Match absolute or relative paths with line and column
   * @example
   * 1. `./src/index.js:1:1`
   * 2. `.\src\index.js:1:1`
   * 3. `../Button.js:1:1`
   * 4. `C:\Users\username\project\src\index.js:1:1`
   * 5. `/home/user/project/src/index.js:1:1`
   */
  const pathRegex = /(?:\.\.?[/\\]|[a-zA-Z]:\\|\/)[^:]*:\d+:\d+/g;

  const urlRegex =
    /(https?:\/\/(?:[\w-]+\.)+[a-z0-9](?:[\w-.~:/?#[\]@!$&'*+,;=])*)/gi;

  const lines = text.split('\n');
  const replacedLines = lines.map((line) => {
    let replacedLine = line.replace(pathRegex, (file) => {
      // If the file contains `</span>`, it means the file path contains ANSI codes.
      // We need to move the `</span>` to the end of the file path.
      const hasClosingSpan =
        file.includes('</span>') && !file.includes('<span');
      const filePath = hasClosingSpan ? file.replace('</span>', '') : file;
      const suffix = hasClosingSpan ? '</span>' : '';
      const isAbsolute = path.isAbsolute(filePath);
      const absolutePath =
        root && !isAbsolute ? path.join(root, filePath) : filePath;
      const relativePath =
        root && isAbsolute ? toRelativePath(root, filePath) : filePath;

      return `<a class="file-link" data-file="${absolutePath}">${relativePath}</a>${suffix}`;
    });

    replacedLine = replacedLine.replace(urlRegex, (url) => {
      return `<a class="url-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    return replacedLine;
  });

  return replacedLines.join('\n');
}

// HTML template for error overlay
export function genOverlayHTML(errors: string[], root?: string) {
  const htmlItems = errors.map((item) =>
    convertLinksInHtml(ansiHTML(escapeHtml(item)), root),
  );
  return `
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
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-width: none;
}
.content::-webkit-scrollbar {
  display: none;
}
.file-link,
.url-link,
.config-link {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}
.file-link {
  color: #6eecf7;
}
.url-link {
  color: #eff986;
}
.config-link {
  color: inherit;
  text-decoration: none;
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
    <pre class="content">${htmlItems.join('\n\n').trim()}</pre>
    <footer class="footer">
      <p><span>Fix error</span>, click outside, or press Esc to close the overlay.</p>
      <p>Disable overlay by setting Rsbuild's <span><a class="config-link" target="_blank" rel="noopener noreferrer" href="https://rsbuild.rs/config/dev/client">dev.client.overlay</a></span> config to false.<p>
    </footer>
  </div>
</div>
`;
}

import ansiHTML from './ansiHTML';
import { escapeHtml } from './helper';

export function convertLinksInHtml(text: string): string {
  const fileRegex = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;

  return text.replace(fileRegex, (file) => {
    // If the file contains `</span>`, it means the file path contains ANSI codes.
    // We need to move the `</span>` to the end of the file path.
    const hasClosingSpan = file.includes('</span>') && !file.includes('<span');
    const filePath = hasClosingSpan ? file.replace('</span>', '') : file;

    return `<a class="file-link" data-file="${filePath}">${filePath}</a>${
      hasClosingSpan ? '</span>' : ''
    }`;
  });
}

// HTML template for error overlay
export function genOverlayHTML(errors: string[]) {
  const htmlItems = errors.map((item) =>
    convertLinksInHtml(ansiHTML(escapeHtml(item))),
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
    <pre class="content">${htmlItems.join('\n\n').trim()}</pre>
    <footer class="footer">
      <p><span>Fix error</span>, click outside, or press Esc to close the overlay.</p>
      <p>Disable overlay by setting Rsbuild's <span>dev.client.overlay</span> config to false.<p>
    </footer>
  </div>
</div>
`;
}

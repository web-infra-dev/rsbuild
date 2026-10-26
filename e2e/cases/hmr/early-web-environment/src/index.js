import { message } from './shared';

document.body.innerHTML = `<div id="message">${message}</div>`;

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

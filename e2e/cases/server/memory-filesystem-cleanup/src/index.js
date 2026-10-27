import('./lazy.js?version=0');

document.body.innerHTML = '<div id="test">0</div>';

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

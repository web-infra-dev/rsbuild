if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
  document.body.textContent = 'HMR enabled';
} else {
  document.body.textContent = 'HMR disabled';
}

document.body.innerHTML = '<div id="test">before</div>';

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

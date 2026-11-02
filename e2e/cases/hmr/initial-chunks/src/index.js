document.querySelector('#root').textContent = 'ready';

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
  import.meta.webpackHot.on('connected', () => {
    document.body.dataset.connected = 'true';
  });
}

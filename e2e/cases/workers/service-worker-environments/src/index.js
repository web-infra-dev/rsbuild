const url = new URL(/* webpackIgnore: true */ '/sw.js', import.meta.url);

navigator.serviceWorker
  .register(url)
  .then(() => navigator.serviceWorker.ready)
  .then(async () => {
    window.swStatus = 'ready';
  })
  .catch(() => {
    window.swStatus = 'error';
  });

console.log('hello');

if (import.meta.webpackHot) {
  // Expose a counter on window so the test can assert handler disposal behavior.
  if (typeof window.__count === 'undefined') {
     window.__count = 0;
  }

  import.meta.webpackHot.on('count', () => {
    window.__count += 1;
    console.log('callback')
  });

  import.meta.webpackHot.accept();
}

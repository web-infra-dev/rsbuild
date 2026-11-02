document.querySelector('#root').textContent = JSON.stringify({
  dot: process.env.NODE_ENV,
  bracket: process.env['NODE_ENV'],
  optional: process.env?.NODE_ENV,
});

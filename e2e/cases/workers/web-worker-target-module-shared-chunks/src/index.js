for (const name of ['double', 'triple']) {
  const output = document.createElement('div');
  output.id = name;
  document.body.appendChild(output);

  // Load the separate worker environment's output without creating a child compilation.
  const worker = new Worker(`/${name}-worker.js`, { type: 'module' });
  worker.onmessage = ({ data }) => {
    output.textContent = String(data);
    worker.terminate();
  };
  worker.postMessage(21);
}

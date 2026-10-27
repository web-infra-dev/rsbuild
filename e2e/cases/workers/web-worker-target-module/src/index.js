// Load the separate worker environment's output without creating a child compilation.
const worker = new Worker('/worker.js', { type: 'module' });

worker.onmessage = ({ data }) => {
  document.getElementById('root').textContent = String(data);
  worker.terminate();
};

worker.postMessage(21);

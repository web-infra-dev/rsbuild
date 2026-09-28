const worker = new Worker('/worker.js', { type: 'module' });

worker.onmessage = ({ data }) => {
  document.getElementById('root').textContent = data;
  worker.terminate();
};

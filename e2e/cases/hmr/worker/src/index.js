const worker = new Worker(new URL('./worker.js', import.meta.url));

worker.onmessage = ({ data }) => {
  const root = document.getElementById('root');
  root.textContent = data.message;
  root.dataset.workerId = data.id;
};

import BlobWorker from './blob-worker.js';

const worker = new BlobWorker(new URL('./worker.js', import.meta.url), {
  type: 'module',
});

worker.onmessage = ({ data }) => {
  const root = document.getElementById('root');
  root.textContent = data.message;
  root.dataset.workerId = data.id;
  root.dataset.workerProtocol = data.protocol;
};

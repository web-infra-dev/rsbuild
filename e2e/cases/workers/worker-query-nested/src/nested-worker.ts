import SubWorker from './sub-worker?worker';

const subWorker = new SubWorker({ name: 'nested-sub-worker' });
const constructorWorker = new Worker(
  new URL('./url-worker.ts', import.meta.url),
  {
    name: 'constructor-worker',
    type: 'module',
  },
);

self.postMessage({
  href: self.location.href,
  text: 'nested-worker',
  type: 'nested-worker',
});

self.onmessage = ({ data }) => {
  if (data === 'ping') {
    subWorker.postMessage('ping');
  }
};

subWorker.addEventListener('message', ({ data }) => {
  self.postMessage(data);
});

constructorWorker.addEventListener('message', ({ data }) => {
  self.postMessage(data);
});

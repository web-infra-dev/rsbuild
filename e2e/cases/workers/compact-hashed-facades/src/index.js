// More than 13 anonymous, module-less worker chunks exhausted compact-hashed IDs.
const workers = [
  new Worker(new URL('./worker.js?00', import.meta.url)),
  new Worker(new URL('./worker.js?01', import.meta.url)),
  new Worker(new URL('./worker.js?02', import.meta.url)),
  new Worker(new URL('./worker.js?03', import.meta.url)),
  new Worker(new URL('./worker.js?04', import.meta.url)),
  new Worker(new URL('./worker.js?05', import.meta.url)),
  new Worker(new URL('./worker.js?06', import.meta.url)),
  new Worker(new URL('./worker.js?07', import.meta.url)),
  new Worker(new URL('./worker.js?08', import.meta.url)),
  new Worker(new URL('./worker.js?09', import.meta.url)),
  new Worker(new URL('./worker.js?10', import.meta.url)),
  new Worker(new URL('./worker.js?11', import.meta.url)),
  new Worker(new URL('./worker.js?12', import.meta.url)),
  new Worker(new URL('./worker.js?13', import.meta.url)),
];

const messages = workers.map(
  (worker, index) =>
    new Promise((resolve) => {
      worker.onmessage = ({ data }) => {
        resolve(data);
        worker.terminate();
      };
      worker.postMessage(index);
    }),
);

Promise.all(messages).then((values) => {
  const element = document.createElement('div');
  element.id = 'workers';
  element.textContent = values.join(',');
  document.body.appendChild(element);
});

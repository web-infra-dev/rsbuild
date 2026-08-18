import ModuleWorker from './chunk-worker?worker';

document.body.innerHTML = '<div id="worker"></div>';

const worker = new ModuleWorker({ name: 'worker' });

worker.addEventListener('message', ({ data }) => {
  const element = document.querySelector('#worker');
  if (element) {
    element.textContent = data.text;
  }
  worker.terminate();
});

worker.postMessage('msg');

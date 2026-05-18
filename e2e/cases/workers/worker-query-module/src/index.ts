import InlineModuleWorker from './inline-module-worker?worker&inline';
import ModuleWorker from './module-worker?worker';

document.body.innerHTML = `
  <div id="module-worker"></div>
  <div id="module-inline-worker"></div>
`;

const setText = (selector: string, text: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
};

const moduleWorker = new ModuleWorker({ name: 'module-worker' });

moduleWorker.addEventListener('message', ({ data }) => {
  setText('#module-worker', data.text);
  moduleWorker.terminate();
});
moduleWorker.postMessage('module message');

const inlineModuleWorker = new InlineModuleWorker({
  name: 'inline-module-worker',
});

inlineModuleWorker.addEventListener('message', ({ data }) => {
  setText('#module-inline-worker', data.text);
  inlineModuleWorker.terminate();
});
inlineModuleWorker.postMessage('inline module message');

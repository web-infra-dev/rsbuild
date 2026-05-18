import NestedWorker from './nested-worker?worker';

document.body.innerHTML = `
  <div id="nested-worker"></div>
  <div id="nested-sub-worker"></div>
  <div id="nested-constructor-worker"></div>
`;

const setText = (selector: string, text: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
};

const worker = new NestedWorker();

worker.addEventListener('message', ({ data }) => {
  if (data.type === 'nested-worker') {
    setText('#nested-worker', `${data.text} ${data.href}`);
  } else if (data.type === 'sub-worker') {
    setText('#nested-sub-worker', data.text);
  } else if (data.type === 'constructor-worker') {
    setText('#nested-constructor-worker', data.text);
  }
});

worker.postMessage('ping');

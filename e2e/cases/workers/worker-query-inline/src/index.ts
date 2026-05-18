import InlineWorker from './inline-worker?worker&inline';
import InlineWorkerReordered from './inline-worker?inline&worker';

document.body.innerHTML = `
  <div id="inline-worker"></div>
  <div id="inline-worker-reordered"></div>
  <div id="inline-worker-unicode"></div>
`;

const setText = (selector: string, text: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
};

const runWorker = (
  worker: Worker,
  message: unknown,
  selector: string,
  format: (data: Record<string, string>) => string,
) => {
  worker.addEventListener('message', ({ data }) => {
    setText(selector, format(data));
    worker.terminate();
  });
  worker.postMessage(message);
};

runWorker(
  new InlineWorker({ name: 'named-inline-worker' }),
  'named-inline-worker',
  '#inline-worker',
  (data) => `${data.text} ${data.name} ${data.marker}`,
);

runWorker(
  new InlineWorkerReordered(),
  'inline-worker-reordered',
  '#inline-worker-reordered',
  (data) => data.text,
);

runWorker(
  new InlineWorker(),
  'unicode',
  '#inline-worker-unicode',
  (data) => data.text,
);

import { message } from './message.js';

const id = crypto.randomUUID();
const report = () =>
  self.postMessage({ message, id, protocol: self.location.protocol });

report();

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('./message.js', report);
}

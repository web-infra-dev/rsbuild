import { double } from './calculate.js';

self.onmessage = ({ data }) => {
  self.postMessage(double(data) + data);
};

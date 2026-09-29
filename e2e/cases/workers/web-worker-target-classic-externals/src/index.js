const worker = new Worker('/bootstrap.js');

worker.onmessage = ({ data }) => {
  document.getElementById('root').textContent = data;
  worker.terminate();
};

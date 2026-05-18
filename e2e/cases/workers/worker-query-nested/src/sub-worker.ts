self.onmessage = ({ data }) => {
  if (data === 'ping') {
    self.postMessage({
      text: `sub-worker:${self.name || 'anonymous'}`,
      type: 'sub-worker',
    });
  }
};

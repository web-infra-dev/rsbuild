self.postMessage({
  text: self.name || 'constructor-worker',
  type: 'constructor-worker',
});

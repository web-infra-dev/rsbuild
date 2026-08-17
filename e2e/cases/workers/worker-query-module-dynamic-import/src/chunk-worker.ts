self.onmessage = async ({ data }) => {
  const { getMessage } = await import(
    /* rspackChunkName: "worker-async" */ './async-message'
  );

  self.postMessage({
    text: getMessage(self.name, data),
  });
};

import('./hello.js').then(({ default: message }) => {
  console.log(message);
});

const { CUSTOM } = import.meta.env;

document.body.textContent = JSON.stringify({
  direct: import.meta.env.CUSTOM,
  destructured: CUSTOM,
  env: { ...import.meta.env },
});

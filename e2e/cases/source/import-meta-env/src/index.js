const { CUSTOM, COUNT, CONFIG, MODE, PUBLIC_DEFINE_ENV_TEST } = import.meta.env;

const result = {
  direct: import.meta.env.CUSTOM,
  destructured: { CUSTOM, COUNT, CONFIG, MODE, PUBLIC_DEFINE_ENV_TEST },
  spread: { ...import.meta.env },
  keys: Object.keys(import.meta.env),
  dynamic: import.meta.env[window.location.hash.slice(1) || 'CUSTOM'],
};

document.body.textContent = JSON.stringify(result);

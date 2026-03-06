import hello from 'esm-pkg';

const helloType = typeof hello;

export { helloType };

export const result =
  helloType === 'function' ? hello() : `BUG: hello is ${helloType}`;

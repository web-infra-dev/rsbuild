const state = process[__NODE_LAZY_STATE_KEY__];
state.entryExecutions++;
let firstPromise;
let secondPromise;

export const loadFirst = async () => {
  state.firstHandlers++;
  firstPromise ??= import('./first.js');
  const { getValue } = await firstPromise;
  return getValue();
};

export const loadSecond = async () => {
  state.secondHandlers++;
  secondPromise ??= import('./second.js');
  const { getValue } = await secondPromise;
  return getValue();
};

export const applyUpdate = () => import.meta.webpackHot.check(true);
export const getHash = () => __webpack_hash__;

const state = process[__NODE_LAZY_STATE_KEY__];
state.entryExecutions++;

export const loadFirst = async () => {
  state.firstHandlers++;
  const { getValue } = await import('./first.js');
  return getValue();
};

export const loadSecond = async () => {
  state.secondHandlers++;
  const { getValue } = await import('./second.js');
  return getValue();
};

export const applyUpdate = () => import.meta.webpackHot.check(true);
export const getHash = () => __webpack_hash__;

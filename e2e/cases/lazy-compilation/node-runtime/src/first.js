import { value } from './value.js';

const state = process[__NODE_LAZY_STATE_KEY__];
state.firstExecutions++;

export const getValue = () => {
  return {
    value,
    ...state,
  };
};

import.meta.webpackHot.accept('./value.js', () => {
  state.firstUpdates++;
});

const state = process[__NODE_LAZY_STATE_KEY__];
state.secondExecutions++;

export const getValue = () => {
  return {
    value: 'second lazy result',
    ...state,
  };
};

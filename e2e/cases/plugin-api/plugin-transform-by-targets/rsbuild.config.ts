import { myPlugin } from './myPlugin';

export default {
  plugins: [myPlugin],
  environments: {
    web: {
      output: {
        target: 'web',
      },
    },
    node: {
      output: {
        target: 'node',
      },
    },
  },
};

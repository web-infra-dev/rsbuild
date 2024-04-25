import { myPlugin } from './myPlugin';

export default {
  plugins: [myPlugin],
  output: {
    targets: ['web', 'node'],
  },
};

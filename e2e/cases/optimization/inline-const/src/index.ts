import { CAT, FISH } from './constants';

declare global {
  interface Window {
    test1: string;
    test2: string;
    test3: string;
  }
}

window.test1 = `${FISH},${FISH.toUpperCase()}`;
window.test2 = `${CAT},${CAT.toUpperCase()}`;

import('./constants2').then(({ DOG }) => {
  window.test3 = `${DOG},${DOG.toUpperCase()}`;
});

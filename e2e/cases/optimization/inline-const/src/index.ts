import { CAT, FISH } from './constants';

declare global {
  interface Window {
    testFish: string;
    testCat: string;
    testDog: string;
  }
}

window.testFish = `${FISH},${FISH.toUpperCase()}`;
window.testCat = `${CAT},${CAT.toUpperCase()}`;

import('./constants2').then(({ DOG }) => {
  window.testDog = `${DOG},${DOG.toUpperCase()}`;
});

import { Animals, Numbers } from './constants';

declare global {
  interface Window {
    testFish: string;
    testCat: string;
    testDog: string;
    testNumbers: string;
  }
}

window.testFish = `${Animals.Fish},${Animals.Fish.toUpperCase()}`;
window.testCat = `${Animals.Cat},${Animals.Cat.toUpperCase()}`;
window.testNumbers = `${Numbers.Zero},${Numbers.One},${Numbers.OnePointOne},${Numbers.One.toFixed(1)},${Numbers.MinusOne},${Numbers.MinusOnePointOne}`;

import('./constants2').then(({ Animals2 }) => {
  window.testDog = `${Animals2.Dog},${Animals2.Dog.toUpperCase()}`;
});

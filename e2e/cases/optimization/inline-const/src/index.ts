import { CAT, FISH } from './constants';

declare global {
  interface Window {
    test1: string;
    test2: string;
  }
}

window.test1 = `Fish ${FISH}, Cat ${CAT}`;
window.test2 = `Fish ${FISH.toUpperCase()}, Cat ${CAT.toUpperCase()}`;

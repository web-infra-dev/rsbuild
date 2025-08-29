import { Animals, Animals2 } from './foo';

declare global {
  interface Window {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
  }
}

window.test1 = `Fish ${Animals.Fish}, Cat ${Animals.Cat}`;
window.test2 = `Fish ${Animals2.Fish}, Cat ${Animals2.Cat}`;
window.test3 = `Fish ${Animals.Fish.toUpperCase()}, Cat ${Animals.Cat.toUpperCase()}`;
window.test4 = `Fish ${Animals2.Fish.toString()}, Cat ${Animals2.Cat.toString()}`;

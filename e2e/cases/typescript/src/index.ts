import { Animals, Animals2 } from './foo';

declare global {
  interface Window {
    test: string;
    test2: string;
  }
}

window.test = `Fish ${Animals.Fish}, Cat ${Animals.Cat}`;
window.test2 = `Fish ${Animals2.Fish}, Cat ${Animals2.Cat}`;

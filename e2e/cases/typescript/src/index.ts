import { Animals } from './foo';

declare global {
  interface Window {
    test: string;
  }
}

window.test = `Fish ${Animals.Fish}, Cat ${Animals.Cat}`;

import { bar } from './bar.jsx';
import { foo } from './foo.jsx';

declare global {
  interface Window {
    test: number;
  }
}

window.test = foo;

console.log(bar);

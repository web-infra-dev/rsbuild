import { message } from './shared';

document.getElementById('root').textContent = message;
document.getElementById('root').onclick = () => {
  throw new Error('Runtime error after early update');
};

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

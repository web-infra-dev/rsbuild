import { message } from './shared';

document.getElementById('root').textContent = message;

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

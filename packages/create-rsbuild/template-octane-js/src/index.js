import { createRoot } from 'octane';
import { App } from './App.tsrx';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(App);
}

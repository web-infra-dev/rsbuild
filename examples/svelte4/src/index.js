import App from './App.svelte';
import './index.css';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
  },
});

export default app;

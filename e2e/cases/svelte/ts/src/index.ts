import type { SvelteComponent } from 'svelte';
import App from './App.svelte';

const app: SvelteComponent = new App({
  target: document.body,
  props: {
    name: 'world',
  },
});

export default app;

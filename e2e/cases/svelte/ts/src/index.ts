import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.body,
  props: {
    name: 'world' as const,
  },
});

export default app;

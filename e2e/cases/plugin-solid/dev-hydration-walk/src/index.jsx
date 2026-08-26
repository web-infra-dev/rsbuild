import { render } from '@solidjs/web';
import { createSignal } from 'solid-js';

const [value] = createSignal('value');

render(
  () => (
    <main>
      <p class={value()}>first</p>
      <span>{value()}</span>
    </main>
  ),
  document.getElementById('root'),
);

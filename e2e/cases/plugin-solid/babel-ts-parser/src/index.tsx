import { render } from '@solidjs/web';
import { createSignal } from 'solid-js';
import { initialCount } from './count';

const App = () => {
  const [count, setCount] = createSignal<number>(initialCount);

  return (
    <button id="button" type="button" onClick={() => setCount(count() + 1)}>
      count: {count()}
    </button>
  );
};

render(App, document.getElementById('root')!);

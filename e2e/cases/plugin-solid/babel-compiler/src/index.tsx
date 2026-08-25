import { render } from '@solidjs/web';
import { createSignal } from 'solid-js';

const App = () => {
  const [count, setCount] = createSignal<number>(0);

  return (
    <button id="button" type="button" onClick={() => setCount(count() + 1)}>
      count: {count()}
    </button>
  );
};

render(App, document.getElementById('root')!);

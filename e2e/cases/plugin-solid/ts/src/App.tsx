import { createSignal } from 'solid-js';

const App = () => {
  const initialCount: number = 0;
  const [count, setCount] = createSignal(initialCount);

  return (
    <button id="button" type="button" onClick={() => setCount(count() + 1)}>
      count: {count()}
    </button>
  );
};

export default App;

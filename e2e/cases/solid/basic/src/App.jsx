import { createSignal } from 'solid-js';

const App = () => {
  const [count, setCount] = createSignal(0);

  return (
    <button id="button" onClick={() => setCount(count() + 1)}>
      count: {count()}
    </button>
  );
};

export default App;

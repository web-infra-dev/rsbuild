import { createSignal } from 'solid-js';

const App = () => {
  const [el, setEl] = createSignal();
  return (
    <div id="test" ref={setEl}>
      abc
    </div>
  );
};

export default App;

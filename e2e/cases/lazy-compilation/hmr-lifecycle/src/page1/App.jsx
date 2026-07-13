import { useState } from 'react';
import './App.css';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <div id="test">Lazy source</div>
      <button id="increment" type="button" onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
      <div id="count">{count}</div>
    </>
  );
};

export default App;

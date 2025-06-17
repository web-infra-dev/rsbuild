import { useState } from 'react';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <button id="button" type="button" onClick={() => setCount(count + 1)}>
        count: {count}
      </button>
      <div className="content">
        <h1>Rsbuild with React</h1>
        <p>Start building amazing things with Rsbuild.</p>
      </div>
    </>
  );
};

export default App;

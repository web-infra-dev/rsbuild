import { useState } from 'react';

export const CompiledCounter = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      id="compiledcounter"
      type="button"
      onClick={() => setCount(count + 1)}
    >
      CompiledCounter: {count}
    </button>
  );
};

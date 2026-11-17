import { useState } from 'react';

export const ExcludedCounter = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      id="excludedcounter"
      type="button"
      onClick={() => setCount(count + 1)}
    >
      ExcludedCounter: {count}
    </button>
  );
};

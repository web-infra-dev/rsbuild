import { useState } from 'react';

export const LegacyCounter = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      id="legacycounter"
      type="button"
      onClick={() => setCount(count + 1)}
    >
      LegacyCounter: {count}
    </button>
  );
};

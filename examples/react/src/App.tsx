import React, { Suspense, useState } from 'react';
import './App.css';
const Test = React.lazy(() => import('./test'));

const App = () => {
  const [showTest, setShowTest] = useState<boolean>(false);
  return (
    <div className="content">
      <h1>Rsbuild with React</h1>
      <p>Start building amazing things with Rsbuild.</p>
      <div
        onClick={() => {
          setShowTest(true);
        }}
      >
        加载
      </div>
      {showTest && (
        <Suspense fallback={<div>Loading...</div>}>
          <Test />
        </Suspense>
      )}
    </div>
  );
};

export default App;

import './App.css';
import React, { useEffect, useState } from 'react';

const App = () => {
  const [renderer, setRenderer] = useState('server');

  useEffect(() => {
    setRenderer('client');
  }, []);

  return (
    <div className="content">
      <h1>Rsbuild with React</h1>
      <p>Hello from {renderer}</p>
      <p>Start building amazing things with Rsbuild.</p>
    </div>
  );
};

export default App;

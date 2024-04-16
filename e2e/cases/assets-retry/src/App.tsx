import React from 'react';
import './App.css';
import CompTest from './CompTest';
import { ErrorBoundary } from './ErrorBoundary';

const AsyncCompTest = React.lazy(() => import('./AsyncCompTest'));

const App = () => {
  return (
    <div className="content">
      <div style={{ border: '1px solid white', padding: 20 }}>
        <ErrorBoundary elementId="comp-test-error">
          <CompTest />
        </ErrorBoundary>
      </div>
      <div style={{ border: '1px solid white', padding: 20 }}>
        <ErrorBoundary elementId="async-comp-test-error">
          <AsyncCompTest />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default App;

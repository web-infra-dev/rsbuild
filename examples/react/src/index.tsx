import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

setTimeout(() => {
  throw new Error('Error 2.');
}, 1000);

throw new Error(
  'React example is deprecated. Please refer to the new examples directory.',
);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

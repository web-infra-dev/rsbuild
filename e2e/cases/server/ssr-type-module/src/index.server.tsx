import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

console.log('load SSR');

// test dynamic import
import('./test');

export function render() {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

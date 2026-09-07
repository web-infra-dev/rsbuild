import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

// test dynamic import
import('./test');

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

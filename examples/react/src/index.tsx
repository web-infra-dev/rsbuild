import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log(process.env);

const { REACT_APP_PUBLIC_URL, API_URL } = process.env;
console.log(REACT_APP_PUBLIC_URL, API_URL);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

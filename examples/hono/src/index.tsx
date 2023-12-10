import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import App from './App';

export const serverRender = () => {
  if (process.env.TARGET === 'service-worker') {
    return ReactDOMServer.renderToString(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    throw new Error('serverRender is only available in service side.');
  }
};

export const clientRender = () => {
  if (process.env.TARGET === 'web') {
    ReactDOM.hydrateRoot(
      document.querySelector('#root')!,
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    throw new Error('clientRender is only available in client side.');
  }
};

if (process.env.TARGET === 'web') {
  clientRender();
}

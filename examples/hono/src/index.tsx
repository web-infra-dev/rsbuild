import { Hono } from 'hono';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import App from './App';

const Template: React.FC = () => (
  <html>
    <head></head>
    <body>
      <App />
    </body>
  </html>
);

if (process.env.TARGET === 'service-worker') {
  const app = new Hono();
  const rendered = ReactDOMServer.renderToString(
    <React.StrictMode>
      <Template />
    </React.StrictMode>,
  );
  app.get('/', (c) => c.html(rendered));
  app.fire();
} else {
  ReactDOM.hydrateRoot(
    window.document,
    <React.StrictMode>
      <Template />
    </React.StrictMode>,
  );
}

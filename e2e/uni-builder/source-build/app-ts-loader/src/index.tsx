import { VERSION, type Plugin } from '@e2e/source-build-common';
import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

const App = () => (
  <div className="container">
    <main>{VERSION}</main>
  </div>
);

root.render(<App />);

export const plugin = { some: true } as Plugin;

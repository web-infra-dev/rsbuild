import React from 'react';
import { createRoot } from 'react-dom/client';
import { Link } from 'react-router-dom';
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}

console.log(Link);

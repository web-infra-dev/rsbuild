import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Link } from 'react-router-dom';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}

console.log(Link);

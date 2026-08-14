import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

window.__lazyHmrDocumentId ??= crypto.randomUUID();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(React.createElement(App));
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import Foo from './Foo';
import Bar from './Bar';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <div>
      <Foo />
      <Bar />
    </div>,
  );
}

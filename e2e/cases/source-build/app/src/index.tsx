import { Card } from '@e2e/source-build-components';
import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);
const App = () => (
  <div className="container">
    <main>
      <Card title="App" content="hello world"></Card>
    </main>
  </div>
);

root.render(<App />);

import { lazy, Suspense } from 'react';

const RemoteButton = lazy(() => import('remote/Button'));

const App = () => (
  <div>
    <h1>Basic Host-Remote</h1>
    <h2>Host</h2>
    <Suspense fallback="Loading Button">
      <RemoteButton />
    </Suspense>
  </div>
);

export default App;

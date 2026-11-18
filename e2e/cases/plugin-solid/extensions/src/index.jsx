import { render } from '@solidjs/web';
import { createSignal } from 'solid-js';
import Cjsx from './cjsx.cjsx';
import Ctsx from './ctsx.ctsx';
import Mjsx from './mjsx.mjsx';
import Mtsx from './mtsx.mtsx';
import Custom from './solid.solid';
import raw from './raw.solid?raw';

function App() {
  const [count, setCount] = createSignal(0);
  return (
    <>
      <button id="count" onClick={() => setCount(count() + 1)}>
        {count()}
      </button>
      <Mjsx />
      <Cjsx />
      <Mtsx />
      <Ctsx />
      <Custom />
      <pre id="raw">{raw}</pre>
    </>
  );
}

render(() => <App />, document.getElementById('root'));

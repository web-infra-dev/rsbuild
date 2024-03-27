import path from 'node:path';
// biome-ignore lint: test non-import protocol
import querystring from 'querystring';

const bufferData = Buffer.from('xxxx');

const qsRes = querystring.stringify({
  foo: 'bar',
});

function App() {
  return (
    <div>
      <div id="test-buffer">{bufferData}</div>
      <div id="test-querystring">{qsRes}</div>
      <div id="test-path">{path.join('foo', 'bar')}</div>
      <div id="test">Hello Rsbuild!</div>
    </div>
  );
}

export default App;

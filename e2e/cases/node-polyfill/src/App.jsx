// biome-ignore lint: node polyfill only supports non-prefix usage
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
      <div id="test">Hello Rsbuild!</div>
    </div>
  );
}

export default App;

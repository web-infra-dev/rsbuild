import url from './small.svg?url';
import Component from './small.svg?custom';

function App() {
  return (
    <div>
      <Component id="component" />
      <img id="url" src={url} alt="url" />
    </div>
  );
}

export default App;

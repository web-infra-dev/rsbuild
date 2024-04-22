import Component from '@assets/circle.svg?custom';
import url from '@assets/circle.svg?url';

function App() {
  return (
    <div>
      <Component id="component" />
      <img id="url" src={url} alt="url" />
    </div>
  );
}

export default App;

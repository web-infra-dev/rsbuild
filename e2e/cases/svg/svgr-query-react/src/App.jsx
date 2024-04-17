import url from '@assets/circle.svg?url';
import Component from '@assets/circle.svg?react';

function App() {
  return (
    <div>
      <Component id="component" />
      <img id="url" src={url} alt="url" />
    </div>
  );
}

export default App;

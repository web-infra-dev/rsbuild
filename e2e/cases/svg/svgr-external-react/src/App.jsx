import svgImg from '@assets/mobile.svg';
import Logo from '@assets/mobile.svg?react';
import './App.css';

function App() {
  return (
    <div>
      <div id="test">Hello Rsbuild!</div>
      <Logo id="test-svg" />
      <img id="test-img" src={svgImg} alt="test" />
      <div id="test-css" />
    </div>
  );
}

export default App;

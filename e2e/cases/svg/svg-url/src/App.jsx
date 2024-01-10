// eslint-disable-next-line no-unused-vars
import Logo from './app.svg';
import svgImg from './app.svg?url';
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

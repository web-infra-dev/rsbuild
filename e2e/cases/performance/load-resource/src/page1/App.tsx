// @ts-expect-error
import Png from './icon.png?url';

const App = () => (
  <>
    <img src={Png} />
    <div id="test">Hello Rsbuild!</div>
  </>
);

export default App;

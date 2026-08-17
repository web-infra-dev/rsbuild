import { render } from '@solidjs/web';
import App from './App';

const container = document.getElementById('root');
if (container) {
  render(() => <App />, container);
}

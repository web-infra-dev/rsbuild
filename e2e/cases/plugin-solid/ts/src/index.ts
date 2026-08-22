import { render } from '@solidjs/web';
import App from './App';

const identity = <T>(value: T) => value;

render(identity(App), document.getElementById('root')!);

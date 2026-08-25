import { render } from '@solidjs/web';
import App from './App';

// Keep this syntax in a `.ts` file to verify it is not parsed as TSX.
const identity = <T>(value: T) => value;

render(identity(App), document.getElementById('root')!);

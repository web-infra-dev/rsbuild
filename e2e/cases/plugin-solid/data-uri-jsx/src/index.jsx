import { render } from '@solidjs/web';
import Component from 'data:text/javascript,export default () => <p id="data-uri">data uri</p>';

render(Component, document.getElementById('root'));

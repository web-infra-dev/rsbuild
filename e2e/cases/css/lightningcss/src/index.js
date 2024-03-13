import './minify.css';
import './transform.css';
import a from './a.module.less';
import b from './b.module.scss';

const lessDom = document.getElementById('test-less');
lessDom.innerHTML = JSON.stringify(a);
lessDom.setAttribute('class', a['test-less']);

const scssDom = document.getElementById('test-scss');
scssDom.innerHTML = JSON.stringify(b);
scssDom.setAttribute('class', b['test-scss']);

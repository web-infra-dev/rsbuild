import x from './initial';
import 'core-js';

const ele = document.createElement('div');
ele.innerHTML = `Hello ${x}`;
ele.setAttribute('id', 'test');
document.body.append(ele);

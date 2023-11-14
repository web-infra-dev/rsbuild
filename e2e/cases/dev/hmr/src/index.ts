import React from 'react';
import { render } from 'react-dom';
import App from './App';

const num = Math.ceil(Math.random() * 100);
const testEl = document.createElement('div');
testEl.id = 'test-keep';

testEl.innerHTML = String(num);

document.body.appendChild(testEl);

render(React.createElement(App), document.getElementById('root'));

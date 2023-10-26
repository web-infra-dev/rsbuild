import { test } from '@common/test';

const testEl = document.createElement('div');
testEl.id = 'test';
testEl.innerHTML = `Hello Rsbuild! ${test}`;

document.body.appendChild(testEl);

window.aa = 2;

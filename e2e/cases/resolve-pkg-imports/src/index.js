import { foo } from '#foo';
import { test } from '#common/test';

const fooEl = document.createElement('div');
fooEl.id = foo;
fooEl.innerHTML = foo;
document.body.appendChild(fooEl);

const testEl = document.createElement('div');
testEl.id = test;
testEl.innerHTML = test;
document.body.appendChild(testEl);

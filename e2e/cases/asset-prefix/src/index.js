const testEl = document.createElement('div');
testEl.id = 'test';
testEl.innerHTML = 'Hello Rsbuild!';

document.body.appendChild(testEl);

const testPortEl = document.createElement('div');
testPortEl.id = 'test-port';
testPortEl.innerHTML = process.env.ASSET_PREFIX;
document.body.appendChild(testPortEl);

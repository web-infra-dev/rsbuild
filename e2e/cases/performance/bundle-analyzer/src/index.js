import React from 'react';
import ReactDOM from 'react-dom';

const testEl = document.createElement('div');
testEl.id = 'test';
testEl.innerHTML = 'Hello Rsbuild!';

document.body.appendChild(testEl);

console.log(React, ReactDOM);

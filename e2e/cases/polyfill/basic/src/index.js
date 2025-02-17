import React from 'react';

console.log('React', React);

const list = [
  { type: '1', value: 1 },
  { type: '1', value: 2 },
  { type: '2', value: 3 },
];

window.a = Object.groupBy(list, ({ type }) => type);

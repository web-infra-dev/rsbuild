import foo from 'foo';
import { createElement } from 'react';
import { flushSync } from 'react-dom';

console.log(createElement, flushSync, foo);

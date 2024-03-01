import './index.css';
import small from './small.png?url';

import(/* webpackChunkName: "foo" */ './async');

console.log(small);

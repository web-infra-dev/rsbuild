import './index.css';

import(
  /* webpackChunkName: "foo" */
  './foo'
);

document.getElementById('root').innerHTML = 'Hello Rsbuild!';

console.log('entry');

import('./foo').then(({ foo }) => {
  console.log(foo);
});

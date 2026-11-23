import aUrl from './a/index.css?url';
import bUrl from './b/index.css?url';
import lessUrl from './less-style.less?url';
import nestedUrl from './nested/style.css?url';
import leadingUrl from './query-leading.css?url&bar=2';
import trailingUrl from './query-trailing.css?foo=1&url';
import valueUrl from './query-value.css?url=1';
import sassUrl from './sass-style.scss?url';

console.log(
  JSON.stringify({
    aUrl,
    bUrl,
    leadingUrl,
    trailingUrl,
    valueUrl,
    nestedUrl,
    lessUrl,
    sassUrl,
  }),
);

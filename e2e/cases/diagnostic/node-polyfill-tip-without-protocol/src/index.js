// biome-ignore lint: node polyfill only supports non-prefix usage
import querystring from 'querystring';

querystring.stringify({
  foo: 'bar',
});

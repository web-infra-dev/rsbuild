import { resolveLocation } from '../src/client/location';

it.each([
  ['blob:http://example.com:8080/worker-id', 'http://example.com:8080/'],
  ['blob:https://example.com:8443/worker-id', 'https://example.com:8443/'],
  ['https://example.com:8443/page', 'https://example.com:8443/page'],
  ['blob:null/worker-id', 'blob:null/worker-id'],
])('should resolve the HMR location for %s', (href, expected) => {
  expect(resolveLocation(new URL(href)).href).toBe(expected);
});

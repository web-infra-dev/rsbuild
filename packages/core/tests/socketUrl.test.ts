import { formatSocketURL } from '../src/client/socketUrl';

it.each([
  ['blob:https://example.com:8443/worker-id', {}, 'wss://example.com:8443'],
  ['https://example.com:8443/page', {}, 'wss://example.com:8443'],
  ['blob:null/worker-id', {}, 'ws://localhost'],
  [
    'blob:https://example.com:8443/worker-id',
    { host: 'dev.example.com', port: 9000, protocol: 'ws' },
    'ws://dev.example.com:9000',
  ],
] as const)(
  'should resolve the HMR URL for %s with %j',
  (href, client, url) => {
    expect(
      formatSocketURL(
        { host: '', port: '', path: '/rsbuild-hmr', ...client },
        'test-token',
        new URL(href),
      ),
    ).toBe(`${url}/rsbuild-hmr?token=test-token`);
  },
);

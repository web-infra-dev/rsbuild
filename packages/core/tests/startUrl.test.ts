import { replacePlaceholder, resolveUrl } from '../src/plugins/startUrl';

describe('plugin-start-url', () => {
  it('#replacePlaceholder - should replace port number correctly', () => {
    expect(replacePlaceholder('http://localhost:8080', 3000)).toEqual(
      'http://localhost:8080',
    );
    expect(replacePlaceholder('http://localhost:<port>', 3000)).toEqual(
      'http://localhost:3000',
    );
    expect(replacePlaceholder('http://localhost:<port>/path/', 3000)).toEqual(
      'http://localhost:3000/path/',
    );
  });

  it('#resolveUrl - should resolve url correctly', () => {
    const baseUrl = 'http://localhost';
    expect(resolveUrl('https://example.com', baseUrl)).toEqual(
      'https://example.com',
    );
    expect(resolveUrl('https://example.com/foo', baseUrl)).toEqual(
      'https://example.com/foo',
    );
    expect(resolveUrl('https://example.com/foo.html', baseUrl)).toEqual(
      'https://example.com/foo.html',
    );
    expect(resolveUrl('/path/to/resource', baseUrl)).toEqual(
      'http://localhost/path/to/resource',
    );
    expect(resolveUrl('//localhost', baseUrl)).toEqual('http://localhost/');
    expect(resolveUrl('path', baseUrl)).toEqual('http://localhost/path');
  });
});

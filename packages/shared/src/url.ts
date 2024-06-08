import { posix } from 'node:path';
import { URL } from 'node:url';

// remove repeat '/'
export const normalizeUrl = (url: string) => url.replace(/([^:]\/)\/+/g, '$1');

// Can be replaced with URL.canParse when we drop support for Node.js 16
export const canParse = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const urlJoin = (base: string, path: string) => {
  const fullUrl = new URL(base);
  fullUrl.pathname = posix.join(fullUrl.pathname, path);
  return fullUrl.toString();
};

export const withPublicPath = (str: string, base: string) => {
  // The use of an absolute URL without a protocol is technically legal,
  // however it cannot be parsed as a URL instance, just return it.
  // e.g. str is //example.com/foo.js
  if (str.startsWith('//')) {
    return str;
  }

  // If str is an complete URL, just return it.
  // Only absolute url with hostname & protocol can be parsed into URL instance.
  // e.g. str is https://example.com/foo.js
  if (canParse(str)) {
    return str;
  }

  if (base.startsWith('http')) {
    return urlJoin(base, str);
  }

  if (base.startsWith('//')) {
    return urlJoin(`https:${base}`, str).replace('https:', '');
  }

  return posix.join(base, str);
};

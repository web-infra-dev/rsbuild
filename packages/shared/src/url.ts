import os from 'os';
import { URL } from 'url';
import { posix } from 'path';
import { DEFAULT_DEV_HOST } from './constants';

// remove repeat '/'
export const normalizeUrl = (url: string) => url.replace(/([^:]\/)\/+/g, '$1');

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
  try {
    return new URL(str).toString();
  } catch {}

  if (base.startsWith('http')) {
    return urlJoin(base, str);
  }

  if (base.startsWith('//')) {
    base = `https:${base}`;
    return urlJoin(base, str).replace('https:', '');
  }

  return posix.join(base, str);
};

export type AddressUrl = { label: string; url: string };

const getIpv4Interfaces = () => {
  const interfaces = os.networkInterfaces();
  const ipv4Interfaces: Map<string, os.NetworkInterfaceInfo> = new Map();

  Object.keys(interfaces).forEach((key) => {
    interfaces[key]!.forEach((detail) => {
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4;

      if (
        detail.family === familyV4Value &&
        !ipv4Interfaces.has(detail.address)
      ) {
        ipv4Interfaces.set(detail.address, detail);
      }
    });
  });
  return Array.from(ipv4Interfaces.values());
};

const isLoopbackHost = (host: string) => {
  const loopbackHosts = ['localhost', '127.0.0.1', '::1'];
  return loopbackHosts.includes(host);
};

export const getAddressUrls = (
  protocol = 'http',
  port: number,
  host?: string,
) => {
  const LOCAL_LABEL = 'Local:  ';
  const NETWORK_LABEL = 'Network:  ';

  if (host && host !== DEFAULT_DEV_HOST) {
    return [
      {
        label: isLoopbackHost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: `${protocol}://${host}:${port}`,
      },
    ];
  }

  const ipv4Interfaces = getIpv4Interfaces();

  return ipv4Interfaces.reduce((memo: AddressUrl[], detail) => {
    if (isLoopbackHost(detail.address) || detail.internal) {
      memo.push({
        label: LOCAL_LABEL,
        url: `${protocol}://localhost:${port}`,
      });
    } else {
      memo.push({
        label: NETWORK_LABEL,
        url: `${protocol}://${detail.address}:${port}`,
      });
    }
    return memo;
  }, []);
};

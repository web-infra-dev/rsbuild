import os from 'os';
import { URL } from 'url';
import urlJoin from 'url-join';
import { DEFAULT_DEV_HOST } from './constants';

export const withPublicPath = (str: string, base: string) => {
  // The use of an absolute URL without a protocol is technically legal,
  // however it cannot be parsed as a URL instance.
  // Just return it.
  // e.g. str is //example.com/foo.js
  if (str.startsWith('//')) {
    return str;
  }

  // Only absolute url with hostname & protocol can be parsed into URL instance.
  // e.g. str is https://example.com/foo.js
  try {
    return new URL(str).toString();
  } catch {}

  return urlJoin(base, str);
};

export type AddressUrl = { label: string; url: string };

const getIpv4Interfaces = () => {
  const interfaces = os.networkInterfaces();
  const ipv4Interfaces: os.NetworkInterfaceInfo[] = [];

  Object.keys(interfaces).forEach((key) => {
    interfaces[key]!.forEach((detail) => {
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4;

      if (detail.family === familyV4Value) {
        ipv4Interfaces.push(detail);
      }
    });
  });
  return ipv4Interfaces;
};

export const getAddressUrls = (
  protocol = 'http',
  port: number,
  host?: string,
) => {
  const LOCAL_LABEL = 'Local:  ';
  const NETWORK_LABEL = 'Network:  ';
  const isLocalhost = (url: string) => url?.includes('localhost');

  if (host && host !== DEFAULT_DEV_HOST) {
    return [
      {
        label: isLocalhost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: `${protocol}://${host}:${port}`,
      },
    ];
  }

  const ipv4Interfaces = getIpv4Interfaces();

  return ipv4Interfaces.reduce((memo: AddressUrl[], detail) => {
    if (isLocalhost(detail.address) || detail.internal) {
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

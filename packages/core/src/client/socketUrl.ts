import type { NormalizedClientConfig } from '../types';

export function formatSocketURL(
  config: Pick<NormalizedClientConfig, 'host' | 'port' | 'protocol' | 'path'>,
  token: string,
  currentLocation: Pick<Location, 'hostname' | 'port' | 'protocol' | 'origin'>,
): string {
  const supportsURL =
    typeof URL !== 'undefined' && 'searchParams' in URL.prototype;
  // Blob workers have no hostname or port, so resolve them from their origin.
  const location =
    supportsURL &&
    currentLocation.protocol === 'blob:' &&
    currentLocation.origin &&
    currentLocation.origin !== 'null'
      ? new URL(currentLocation.origin)
      : currentLocation;
  const hostname = config.host || location.hostname;
  const port = config.port || location.port;
  const protocol =
    config.protocol || (location.protocol === 'https:' ? 'wss' : 'ws');
  const pathname = config.path;

  if (supportsURL) {
    const url = new URL('http://localhost');
    url.port = String(port);
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    url.searchParams.append('token', token);
    return url.toString();
  }

  // compatible with IE 11 and legacy WebKit where URL lacks searchParams
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}?token=${token}`;
}

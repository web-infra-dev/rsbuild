type ParsedSearch = {
  host: string;
  port: string;
  path: string;
  protocol?: 'ws' | 'wss';
};

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/rsbuild-hmr';

export function createSocketUrl(options: Record<string, string> = {}) {
  const currentLocation = self.location;

  return getSocketUrl(options as ParsedSearch, currentLocation);
}

export function formatURL({
  port,
  protocol,
  hostname,
  pathname,
}: {
  port: string;
  protocol: string;
  hostname: string;
  pathname: string;
}) {
  if (typeof URL !== 'undefined') {
    const url = new URL('http://localhost');
    url.port = port;
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
}

function getSocketUrl(urlParts: ParsedSearch, location: Location) {
  const { host, port, path, protocol } = urlParts;

  return formatURL({
    protocol: protocol || (location.protocol === 'https:' ? 'wss' : 'ws'),
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || HMR_SOCK_PATH,
  });
}

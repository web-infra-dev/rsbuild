import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';
import type { Connect } from '../types';
import type { UpgradeEvent } from './helper';

const HOST_CHECK_ERROR =
  'Blocked request: disallowed or invalid Host header. To allow a trusted hostname, add it to server.allowedHosts.';

export function createHostCheckMiddleware(
  allowedHosts: readonly string[],
): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (isRequestHostAllowed(req.headers, allowedHosts)) {
      next();
      return;
    }
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(HOST_CHECK_ERROR);
  };
}

export function withHostCheck(
  onUpgrade: UpgradeEvent,
  allowedHosts: readonly string[],
): UpgradeEvent {
  return (req, socket, head) => {
    if (!isRequestHostAllowed(req.headers, allowedHosts)) {
      socket.end(
        'HTTP/1.1 403 Forbidden\r\n' +
          'Connection: close\r\n' +
          'Content-Type: text/plain; charset=utf-8\r\n' +
          `Content-Length: ${Buffer.byteLength(HOST_CHECK_ERROR)}\r\n\r\n` +
          HOST_CHECK_ERROR,
      );
      socket.destroySoon();
      return;
    }
    onUpgrade(req, socket, head);
  };
}

export function isRequestHostAllowed(
  headers: IncomingHttpHeaders,
  allowedHosts: readonly string[],
): boolean {
  const { host, ':authority': authority } = headers;
  // HTTP/2 uses :authority. Reject conflicting headers to avoid ambiguity.
  if (authority !== undefined && host !== undefined && authority !== host) {
    return false;
  }
  const hostHeader = authority ?? host;
  return (
    typeof hostHeader === 'string' && isHostAllowed(hostHeader, allowedHosts)
  );
}

const normalizeHostname = (hostname: string): string =>
  hostname.toLowerCase().replace(/\.$/, '');

/** Check a Host header against local hosts, IP addresses, and additional hosts. */
export function isHostAllowed(
  hostHeader: string | undefined,
  allowedHosts: readonly string[],
): boolean {
  // Reject characters that URL parsing could interpret as other URL components
  // or normalize away instead of treating them as part of the host.
  if (!hostHeader || /[\s/@\\?#%]/.test(hostHeader)) {
    return false;
  }

  let hostname: string;
  try {
    // URL validates IPv6 addresses and ports, and normalizes IPv4 addresses.
    hostname = normalizeHostname(new URL(`http://${hostHeader}`).hostname);
  } catch {
    return false;
  }

  if (
    hostname.startsWith('[') ||
    isIP(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost')
  ) {
    return true;
  }

  return allowedHosts.some((allowedHost) => {
    const normalized = normalizeHostname(allowedHost);
    return (
      hostname === normalized ||
      (normalized.startsWith('.') &&
        (hostname === normalized.slice(1) || hostname.endsWith(normalized)))
    );
  });
}

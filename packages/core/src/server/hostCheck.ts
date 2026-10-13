import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';

export const HOST_CHECK_ERROR =
  'Blocked request: disallowed or invalid Host header. To allow a trusted hostname, add it to server.allowedHosts.';

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

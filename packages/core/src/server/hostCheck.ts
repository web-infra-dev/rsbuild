import { isIP } from 'node:net';

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

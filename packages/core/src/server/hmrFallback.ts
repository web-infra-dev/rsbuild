import type { DevConfig, ServerConfig } from '../types/config';
import { isWildcardHost } from './helper';

/**
 * Checks if localhost resolves differently between node's default DNS lookup
 * and explicit DNS lookup.
 *
 * Returns the resolved address if there's a difference, undefined otherwise.
 * This helps detect cases where IPv4/IPv6 resolution might vary.
 */
export async function getLocalhostResolvedAddress(): Promise<
  string | undefined
> {
  const { promises: dns } = await import('node:dns');
  const [defaultLookup, explicitLookup] = await Promise.all([
    dns.lookup('localhost'),
    dns.lookup('localhost', { verbatim: true }),
  ]);
  const match =
    defaultLookup.family === explicitLookup.family &&
    defaultLookup.address === explicitLookup.address;
  return match ? undefined : defaultLookup.address;
}

async function resolveHostname(host: string | undefined = 'localhost') {
  if (host === 'localhost') {
    const resolvedAddress = await getLocalhostResolvedAddress();
    if (resolvedAddress) {
      return resolvedAddress;
    }
  }

  // If possible, set the host name to localhost
  return host === undefined || isWildcardHost(host) ? 'localhost' : host;
}

export async function getResolvedClientConfig(
  clientConfig: DevConfig['client'],
  serverConfig: ServerConfig,
): Promise<DevConfig['client']> {
  const resolvedHost = await resolveHostname(serverConfig.host);
  return {
    ...clientConfig,
    host: resolvedHost,
    port: serverConfig.port,
  };
}

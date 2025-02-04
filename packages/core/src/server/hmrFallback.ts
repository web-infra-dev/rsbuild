import { promises as dns } from 'node:dns';
import type { DevConfig, ServerConfig } from '../types/config';

type Hostname = {
  host?: string;
  name: string;
};

const wildcardHosts = new Set([
  '0.0.0.0',
  '::',
  '0000:0000:0000:0000:0000:0000:0000:0000',
]);

export async function resolveHostname(
  optionsHost: string | undefined,
): Promise<Hostname> {
  let host: string | undefined;
  if (optionsHost === undefined) {
    // Use a secure default
    host = 'localhost';
  } else {
    host = optionsHost;
  }

  // Set host name to localhost when possible
  let name = host === undefined || wildcardHosts.has(host) ? 'localhost' : host;

  if (host === 'localhost') {
    const localhostAddr = await getLocalhostAddressIfDiffersFromDNS();
    if (localhostAddr) {
      name = localhostAddr;
    }
  }

  return { host, name };
}

/**
 * Returns resolved localhost address when `dns.lookup` result differs from DNS
 *
 * `dns.lookup` result is same when defaultResultOrder is `verbatim`.
 * Even if defaultResultOrder is `ipv4first`, `dns.lookup` result maybe same.
 * For example, when IPv6 is not supported on that machine/network.
 */
export async function getLocalhostAddressIfDiffersFromDNS(): Promise<
  string | undefined
> {
  const [nodeResult, dnsResult] = await Promise.all([
    dns.lookup('localhost'),
    dns.lookup('localhost', { verbatim: true }),
  ]);
  const isSame =
    nodeResult.family === dnsResult.family &&
    nodeResult.address === dnsResult.address;
  return isSame ? undefined : nodeResult.address;
}

export async function getResolvedClientConfig(
  clientConfig: DevConfig['client'],
  serverConfig: ServerConfig,
): Promise<DevConfig['client']> {
  const resolvedServerHostname = (await resolveHostname(serverConfig.host))
    .name;
  const resolvedServerPort = serverConfig.port!;
  return {
    ...clientConfig,
    host: resolvedServerHostname,
    port: resolvedServerPort,
  };
}

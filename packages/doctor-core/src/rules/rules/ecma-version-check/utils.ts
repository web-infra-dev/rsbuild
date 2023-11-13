import type { ECMAVersion } from '@rsbuild/doctor-utils/ruleUtils';

export function getVersionNumber(ECMAString: ECMAVersion) {
  const version = ECMAString.match(/\d/);

  return version?.length ? Number(version[0]) : undefined;
}

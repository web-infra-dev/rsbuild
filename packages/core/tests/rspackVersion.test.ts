import { isSatisfyRspackVersion, rspackMinVersion } from '../src/helpers';

describe('rspack version', () => {
  it('isSatisfyRspackVersion', () => {
    expect(isSatisfyRspackVersion('0.1.0')).toBeFalsy();

    expect(isSatisfyRspackVersion(rspackMinVersion)).toBeTruthy();

    expect(isSatisfyRspackVersion('10.0.0')).toBeTruthy();

    expect(
      isSatisfyRspackVersion('0.2.7-canary-efa0dc6-20230817005622'),
    ).toBeFalsy();

    expect(
      isSatisfyRspackVersion(
        `${rspackMinVersion}-canary-efa0dc6-20230817005622`,
      ),
    ).toBeTruthy();
  });
});

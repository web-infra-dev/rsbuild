import { isSatisfyRspackVersion, rspackMinVersion } from '../src/helpers';

describe('rspack version', () => {
  it('isSatisfyRspackVersion', async () => {
    expect(await isSatisfyRspackVersion('0.1.0')).toBeFalsy();

    expect(await isSatisfyRspackVersion(rspackMinVersion)).toBeTruthy();

    expect(await isSatisfyRspackVersion('10.0.0')).toBeTruthy();

    expect(
      await isSatisfyRspackVersion('0.2.7-canary-efa0dc6-20230817005622'),
    ).toBeFalsy();

    expect(
      await isSatisfyRspackVersion(
        `${rspackMinVersion}-canary-efa0dc6-20230817005622`,
      ),
    ).toBeTruthy();
  });
});

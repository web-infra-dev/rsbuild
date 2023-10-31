import { describe, it, vi, expect } from 'vitest';
import { SDK } from '@rsbuild/doctor-types';
import { setupSDK } from '../../utils';

describe('test server/apis/fs.ts', () => {
  const target = setupSDK();

  it(`test api: ${SDK.ServerAPI.API.ApplyErrorFix}`, async () => {
    const spy = vi
      .spyOn(target.sdk, 'applyErrorFix')
      .mockImplementation(async () => {});

    await target.post(SDK.ServerAPI.API.ApplyErrorFix, { id: 111 } as any);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(111);

    spy.mockRestore();
  });
});

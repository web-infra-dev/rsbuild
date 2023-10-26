import { describe, it, expect, vi } from 'vitest';
import { SDK } from '@rsbuild/doctor-types';

import { APIDataLoader } from '../../src/common/data';

describe('test src/common/data/index.ts', () => {
  const excludeAPIs = [
    SDK.ServerAPI.API.ApplyErrorFix,
    SDK.ServerAPI.API.Env,
    SDK.ServerAPI.API.EntryHtml,
    SDK.ServerAPI.API.Manifest,
    SDK.ServerAPI.API.ReportLoader,
    SDK.ServerAPI.API.ReportSourceMap,
    SDK.ServerAPI.API.SendAPIDataToClient,
  ];

  const testAPIs = Object.values(SDK.ServerAPI.API).filter(
    (e) => !excludeAPIs.includes(e),
  );

  it('ensure implement api with server and client', () => {
    const fn = vi.fn().mockImplementation(() => new Promise(() => {}));

    const loader = new APIDataLoader({
      loadData: fn,
      loadManifest: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    testAPIs.forEach((api) => {
      if (api === SDK.ServerAPI.API.LoadDataByKey) {
        // SDK.ServerAPI.API.LoadDataByKey must set body to avoid error
        expect(loader.loadAPI(api, { key: 'hash' })).toBeInstanceOf(Promise);
      } else {
        expect(loader.loadAPI(api)).toBeInstanceOf(Promise);
      }
    });
  });

  it('ensure api not implement with server and client', () => {
    const fn = vi.fn();

    const loader = new APIDataLoader({
      loadData: fn,
      loadManifest: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    excludeAPIs.forEach((api) => {
      expect(() => loader.loadAPI(api)).toThrowError(
        `API not implement: "${api}"`,
      );
    });
  });
});

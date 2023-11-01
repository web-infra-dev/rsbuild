import { describe, it, expect, vi } from 'vitest';
import ip from 'ip';
import { Manifest, SDK } from '@rsbuild/doctor-types';
import { Manifest as ManifestShared } from '@rsbuild/doctor-utils';

import { cwd, setupSDK } from '../../utils';

vi.setConfig({ testTimeout: 50000 });

describe('test server/apis/project.ts', () => {
  const target = setupSDK();

  it(`test api: ${SDK.ServerAPI.API.Env}`, async () => {
    const env = (await target.get(SDK.ServerAPI.API.Env)).toJSON();

    expect(env.ip).toEqual(ip.address());
    expect(env.port).toEqual(target.server.port);
  });

  it(`test api: ${SDK.ServerAPI.API.Manifest}`, async () => {
    target.sdk.addClientRoutes([
      Manifest.DoctorManifestClientRoutes.WebpackLoaders,
    ]);

    const manifestStr = (
      await target.get(SDK.ServerAPI.API.Manifest)
    ).toString();
    const manifest: Manifest.DoctorManifest = JSON.parse(manifestStr);

    expect(manifest.data.root === cwd);
    expect(manifest.client.enableRoutes).toStrictEqual([
      Manifest.DoctorManifestClientRoutes.Overall,
      Manifest.DoctorManifestClientRoutes.WebpackLoaders,
    ]);
    expect(manifest.data.pid).toEqual(process.pid);

    // expect the value in manifest.data is sharding files url.
    Object.keys(manifest.data)
      .filter((key) => typeof manifest.data[key] === 'object')
      .forEach((key) => {
        expect(manifest.data[key]).toBeInstanceOf(Array);
        expect(ManifestShared.isShardingData(manifest.data[key])).toBeTruthy();
      });
  });
});

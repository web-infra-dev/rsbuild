import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { File, Server } from '@rsbuild/doctor-utils/build';
import { Common, SDK } from '@rsbuild/doctor-types';
import { request } from 'http';
import { tmpdir } from 'os';
import path from 'path';
import { DoctorWebpackSDK } from '../src/sdk';

export interface MockSDKResponse {
  sdk: DoctorWebpackSDK;
  server: SDK.DoctorServerInstance;
  // get<T extends boolean = false>(pathname: string, toJson?: T): Promise<T extends true ? object : string>;
  get<T extends SDK.ServerAPI.API>(
    pathname: T,
  ): Promise<{
    toJSON(): SDK.ServerAPI.InferResponseType<T>;
    toString(): string;
    text: string;
  }>;
  post<T extends SDK.ServerAPI.API>(
    pathname: T,
    body: SDK.ServerAPI.InferRequestBodyType<T>,
  ): Promise<{
    toJSON(): SDK.ServerAPI.InferResponseType<T>;
    toString(): string;
    text: string;
  }>;
  dispose(): Promise<void>;
}

export const cwd = process.cwd();

export async function createSDK(
  config?: SDK.SDKOptionsType,
): Promise<MockSDKResponse> {
  const port = await Server.getPort(4396);
  const sdk = new DoctorWebpackSDK({ name: 'test', root: cwd, port, config });

  await sdk.bootstrap();

  return {
    sdk,
    server: sdk.server,
    get(pathname) {
      return new Promise((resolve, reject) => {
        const url = new URL(`${sdk.server.origin}${pathname}`);
        const req = request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'GET',
          },
          (res) => {
            let data = '';
            res.on('data', (d: Buffer) => {
              data += d.toString('utf-8');
            });
            res.on('close', () => {
              resolve({
                toJSON: () => JSON.parse(data),
                toString: () => data.toString(),
                text: data,
              });
            });
          },
        );

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    },
    post(pathname, body) {
      return new Promise((resolve, reject) => {
        const url = new URL(`${sdk.server.origin}${pathname}`);
        const req = request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          (res) => {
            let data = '';
            res.on('data', (d: Buffer) => {
              data += d.toString('utf-8');
            });
            res.on('close', () => {
              resolve({
                toJSON: () => JSON.parse(data),
                toString: () => data.toString(),
                text: data,
              });
            });
          },
        );

        req.on('error', (error) => {
          reject(error);
        });

        req.write(JSON.stringify((body || {}) as Common.PlainObject));
        req.end();
      });
    },
    async dispose() {
      await sdk.dispose();
    },
  };
}

export function setupSDK(config?: SDK.SDKOptionsType) {
  let target: MockSDKResponse;

  beforeAll(async () => {
    target = await createSDK(config);
  });

  beforeEach(async () => {
    const outdir = path.resolve(
      tmpdir(),
      `./${Date.now()}/web_doctor_sdk_test`,
    );
    target.sdk.setOutputDir(outdir);
  });

  afterEach(async () => {
    await File.fse.remove(target.sdk.outputDir);
  });

  afterAll(async () => {
    await target.dispose();
  });

  return new Proxy(
    {},
    {
      get(trap, p, receiver) {
        return Reflect.get(target, p, receiver);
      },
      set(trap, key, value, receiver) {
        return Reflect.set(target, key, value, receiver);
      },
      defineProperty(trap, p, attrs) {
        return Reflect.defineProperty(target, p, attrs);
      },
    },
  ) as MockSDKResponse;
}

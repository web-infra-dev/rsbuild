import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { loadLoaderModule } from '@/build-utils/build/utils';


describe('test src/build/utils/loader.ts loadLoaderModule()', () => {
  process.env.DOCTOR_TEST = 'true';

  const loaderDirectory = resolve(__dirname, '../../../fixtures/loaders');

  it('basic loader', () => {
    const cjs = loadLoaderModule('./basic-loader.js', loaderDirectory);

    expect(cjs.default).toBeInstanceOf(Function);
    expect(cjs.pitch).toBeUndefined();
    expect(cjs.raw).toBeFalsy();

    const esm = loadLoaderModule('basic-loader-esm', loaderDirectory);
    expect(esm.default).toBeInstanceOf(Function);
    expect(esm.pitch).toBeUndefined();
    expect(esm.raw).toBeFalsy();
  });

  it('pitch loader', () => {
    const cjs = loadLoaderModule('pitch-loader', loaderDirectory);

    expect(cjs.default).toBeInstanceOf(Function);
    expect(cjs.pitch).toBeInstanceOf(Function);
    expect(cjs.raw).toBeFalsy();

    const esm = loadLoaderModule('pitch-loader-esm', loaderDirectory);
    expect(esm.default).toBeInstanceOf(Function);
    expect(esm.pitch).toBeInstanceOf(Function);
    expect(esm.raw).toBeFalsy();
  });

  it('raw loader', () => {
    const cjs = loadLoaderModule('raw-loader', loaderDirectory);
    expect(cjs.default).toBeInstanceOf(Function);
    expect(cjs.pitch).toBeUndefined();
    expect(cjs.raw).toBeTruthy();

    const esm = loadLoaderModule('raw-loader-esm', loaderDirectory);
    expect(esm.default).toBeInstanceOf(Function);
    expect(esm.pitch).toBeUndefined();
    expect(esm.raw).toBeTruthy();
  });
});

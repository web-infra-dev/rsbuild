import { describe, it, expect, vi } from 'vitest';
import {
  interceptCompilationHooks,
  interceptCompilerHooks,
  shouldInterceptPluginHook,
} from '@/build-utils/build/utils';

describe('test src/build/utils/plugin.ts', () => {
  it('shouldInterceptPluginHook()', () => {
    // @ts-ignore
    expect(shouldInterceptPluginHook({ _fakeHook: true })).toBeFalsy();
    // @ts-ignore
    expect(shouldInterceptPluginHook({ isUsed: () => true })).toBeTruthy();
    // @ts-ignore
    expect(shouldInterceptPluginHook({ isUsed: () => false })).toBeFalsy();
    // @ts-ignore
    expect(shouldInterceptPluginHook({ _map: new Map() })).toBeFalsy();
    // @ts-ignore
    expect(shouldInterceptPluginHook({ _map: new Map([[]]) })).toBeTruthy();
    // @ts-ignore
    expect(shouldInterceptPluginHook({})).toBeTruthy();
  });

  it('interceptCompilerHooks()', () => {
    const fn = vi.fn();
    // @ts-ignore
    interceptCompilerHooks({ hooks: { a: 1 } }, fn);
    expect(fn).toBeCalledTimes(1);
    expect(fn).toBeCalledWith('a', 1, 'compiler');
  });

  it('interceptCompilationHooks(): basic', () => {
    const fn = vi.fn();
    // @ts-ignore
    interceptCompilationHooks({ hooks: { a: 1 } }, fn);
    expect(fn).toBeCalledTimes(1);
    expect(fn).toBeCalledWith('a', 1, 'compilation');
  });

  it('interceptCompilationHooks(): normalModuleLoader && webpack5 ', () => {
    const fn = vi.fn();
    interceptCompilationHooks(
      // @ts-ignore
      { hooks: { normalModuleLoader: 1 }, moduleGraph: {} },
      fn,
    );
    expect(fn).toBeCalledTimes(0);
  });
});

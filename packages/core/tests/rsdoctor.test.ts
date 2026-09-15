import { join } from 'node:path';
import type { OnBeforeCreateCompilerFn } from '../src/types/hooks';
import type { RsbuildPluginAPI } from '../src/types/plugin';
import type { Rspack } from '../src';
import { pluginRsdoctor } from '../src/plugins/rsdoctor';

describe('pluginRsdoctor', () => {
  beforeEach(() => {
    process.env.RSDOCTOR = 'true';
  });

  afterEach(() => {
    delete process.env.RSDOCTOR;
  });

  it('should fall back to the legacy package when core is missing', async () => {
    const log = rstest.fn();
    let onBeforeCreateCompiler: OnBeforeCreateCompilerFn | undefined;
    const resolvePackage = rstest.fn((packageName: string) => {
      if (packageName === '@rsdoctor/core') {
        const error = new Error('Cannot find module @rsdoctor/core');
        (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
        throw error;
      }
      return join(import.meta.dirname, 'fixtures/rsdoctor-rspack-plugin.js');
    });
    const plugin = pluginRsdoctor(resolvePackage);

    plugin.setup({
      context: { rootPath: import.meta.dirname },
      logger: { info: log },
      onBeforeCreateCompiler: (handler: OnBeforeCreateCompilerFn) => {
        onBeforeCreateCompiler = handler as OnBeforeCreateCompilerFn;
      },
    } as unknown as RsbuildPluginAPI);

    const bundlerConfigs: Rspack.Configuration[] = [{}];
    expect(onBeforeCreateCompiler).toBeDefined();
    await onBeforeCreateCompiler!({ bundlerConfigs, environments: {} });

    expect(resolvePackage).toHaveBeenNthCalledWith(
      1,
      '@rsdoctor/core',
      import.meta.dirname,
    );
    expect(resolvePackage).toHaveBeenNthCalledWith(
      2,
      '@rsdoctor/rspack-plugin',
      import.meta.dirname,
    );
    expect(bundlerConfigs[0].plugins).toHaveLength(1);
    expect(log).toHaveBeenCalledWith('@rsdoctor/rspack-plugin enabled.');
  });
});

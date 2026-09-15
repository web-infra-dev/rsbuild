import { join } from 'node:path';
import { createRsbuild, type Rspack } from '../src';
import { require } from '../src/helpers';

describe('pluginRsdoctor', () => {
  beforeEach(() => {
    process.env.RSDOCTOR = 'true';
  });

  afterEach(() => {
    delete process.env.RSDOCTOR;
  });

  it('should fall back to the legacy package when core is missing', async () => {
    const resolve = require.resolve.bind(require);
    const resolveSpy = rstest
      .spyOn(require, 'resolve')
      .mockImplementation((packageName, options) => {
        if (packageName === '@rsdoctor/core') {
          const error = new Error('Cannot find module @rsdoctor/core');
          (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
          throw error;
        }

        if (packageName === '@rsdoctor/rspack-plugin') {
          return join(
            import.meta.dirname,
            'fixtures/rsdoctor-rspack-plugin.js',
          );
        }

        return resolve(packageName, options);
      });

    try {
      const rsbuild = await createRsbuild({
        cwd: join(import.meta.dirname, '..'),
      });
      const compiler = await rsbuild.createCompiler();
      const plugins = (compiler.options as Rspack.Configuration).plugins;

      expect(
        plugins?.filter(
          (plugin) => plugin?.constructor?.name === 'RsdoctorRspackPlugin',
        ),
      ).toHaveLength(1);
    } finally {
      resolveSpy.mockRestore();
    }
  });
});

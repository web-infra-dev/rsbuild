import { promisify } from 'node:util';
import { expect, test } from '@e2e/helper';
import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core';

for (const mode of ['dev', 'build']) {
  test(`should print completion logs after all progress bars finish in ${mode}`, async ({
    devOnly,
    build,
    logHelper,
  }) => {
    let fastDone = Promise.withResolvers<number>();
    let earlyLogs: string[] = [];
    let compilers: Rspack.Compiler[] = [];
    const loggedEnvironments = () =>
      logHelper.logs
        .filter((log) => log.includes('built in'))
        .map((log) => log.match(/\((fast|slow)\)/)![1]);
    const config = {
      plugins: [
        {
          name: 'test-progress-logs',
          setup(api: RsbuildPluginAPI) {
            api.onAfterCreateCompiler(({ compiler }) => {
              compilers = (compiler as Rspack.MultiCompiler).compilers;
            });
            api.onAfterEnvironmentCompile(({ environment, time }) => {
              if (environment.name === 'fast') fastDone.resolve(time);
            });
            api.processAssets(
              { stage: 'optimize', environments: ['slow'] },
              async () => {
                await fastDone.promise;
                earlyLogs = loggedEnvironments();
              },
            );
          },
        },
      ],
    };

    if (mode === 'dev') await devOnly({ config });
    else await build({ config });

    expect(await fastDone.promise).toBeGreaterThan(0);
    expect(earlyLogs).toEqual([]);
    expect(loggedEnvironments()).toEqual(['fast', 'slow']);

    if (mode === 'build') return;

    for (const names of [['fast', 'slow'], ['fast']]) {
      logHelper.clearLogs();
      earlyLogs = [];
      fastDone = Promise.withResolvers<number>();
      await Promise.all(
        compilers
          .filter((compiler) => names.includes(compiler.name!))
          .map(({ watching }) =>
            promisify(watching!.invalidate.bind(watching))(),
          ),
      );
      expect(earlyLogs).toEqual([]);
      expect(loggedEnvironments()).toEqual(names);
    }
  });
}

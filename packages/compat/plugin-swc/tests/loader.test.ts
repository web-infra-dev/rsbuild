import type { LoaderContext, LoaderDefinitionFunction } from 'webpack';
import { createLoader } from '../src/loader';

const mockSwcLoaderRunner = (): [
  Promise<ReturnType<LoaderDefinitionFunction>>,
  LoaderContext<Record<string, never>>,
] => {
  let resolve: unknown;

  const p = new Promise<ReturnType<LoaderDefinitionFunction>>((r) => {
    resolve = r;
  });

  return [
    p,
    {
      getOptions() {
        return {};
      },
      async() {
        return resolve;
      },
      resourcePath: '/test.js',
    } as LoaderContext<Record<string, never>>,
  ];
};

describe('loader test', () => {
  it('should handle loader interface correctly', async () => {
    const loader = createLoader();

    const [finish, runner] = mockSwcLoaderRunner();

    loader.call(runner, '', {
      version: 3,
      file: 'app.js',
      sources: [],
      sourceRoot: '',
      names: [],
      mappings: '',
    });

    await finish;
  });
});

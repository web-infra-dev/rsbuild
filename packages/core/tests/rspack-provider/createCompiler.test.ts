import { createCompiler } from '@/core/createCompiler';
import { createContext } from '@/core/createContext';

describe('createCompiler', () => {
  const createDefaultContext = () =>
    createContext(
      {
        cwd: process.cwd(),
      },
      {
        source: {
          entry: {
            index: './src/index.js',
          },
        },
      },
    );

  test('should return Compiler when passing single rspack config', async () => {
    const compiler = await createCompiler({
      context: await createDefaultContext(),
      rspackConfigs: [{}],
    });
    expect(compiler.constructor.name).toEqual('Compiler');
  });
  test('should return MultiCompiler when passing multiple rspack configs', async () => {
    const compiler = await createCompiler({
      context: await createDefaultContext(),
      rspackConfigs: [{}, {}],
    });
    expect(compiler.constructor.name).toEqual('MultiCompiler');
  });
});

import { createCompiler } from '../src/provider/core/createCompiler';
import { createContext } from '../src/provider/core/createContext';

describe('createCompiler', () => {
  const createDefaultContext = () =>
    createContext(
      {
        cwd: process.cwd(),
        rsbuildConfig: {},
      },
      {
        source: {
          entry: {
            index: './src/index.js',
          },
        },
      },
      'rspack',
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

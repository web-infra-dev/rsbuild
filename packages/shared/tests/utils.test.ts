import { createDependenciesRegExp } from '../src';

test('createDependenciesRegExp', () => {
  const cases = {
    'react,react-dom,history':
      /[\\/]node_modules[\\/](react|react-dom|history)[\\/]/,
    '@babel/runtime': /[\\/]node_modules[\\/](@babel\/runtime)[\\/]/,
  };
  for (const [deps, expected] of Object.entries(cases)) {
    const actual = createDependenciesRegExp(...deps.split(','));
    expect(actual).toEqual(expected);
  }
});

import { awaitableGetter, camelCase, createDependenciesRegExp } from '../src';

describe('awaitableGetter', () => {
  it('should work', async () => {
    const arr = ['123', '456'];
    const promises = arr.map((item) => Promise.resolve(item));
    const wrapped = awaitableGetter(promises);
    expect(wrapped.promises).toStrictEqual(promises);
    expect(await wrapped).toStrictEqual(arr);
  });
});

describe('camelCase', () => {
  test('should convert snake_case to camelCase', () => {
    expect(camelCase('hello_world')).toBe('helloWorld');
  });

  test('should convert kebab-case to camelCase', () => {
    expect(camelCase('foo-bar-baz')).toBe('fooBarBaz');
  });

  test('should handle already camelCase input', () => {
    expect(camelCase('alreadyCamelCase')).toBe('alreadyCamelCase');
  });

  test('should handle empty input', () => {
    expect(camelCase('')).toBe('');
  });

  test('should handle single-word input', () => {
    expect(camelCase('single')).toBe('single');
  });
});

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

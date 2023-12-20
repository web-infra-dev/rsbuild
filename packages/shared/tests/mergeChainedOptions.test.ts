import { mergeChainedOptions, isNil } from '../src';

describe('mergeChainedOptions', () => {
  test(`should return default options`, () => {
    expect(mergeChainedOptions({ defaults: { value: 'a' } })).toEqual({
      value: 'a',
    });
  });

  test(`should merge default options`, () => {
    expect(
      mergeChainedOptions({
        defaults: { name: 'a' },
        options: {
          name: 'b',
          custom: 'c',
        },
      }),
    ).toEqual({
      name: 'b',
      custom: 'c',
    });
  });

  test(`should support custom merge function`, () => {
    const merge = (target: any, source: any) => {
      for (const key in source) {
        if (Object.hasOwn(target, key)) {
          target[key] += source[key];
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    expect(
      mergeChainedOptions({
        defaults: {
          a: 1,
          b: 'b',
        },
        options: {
          a: 2,
          b: 'b',
          c: 'c',
        },
        mergeFn: merge,
      }),
    ).toEqual({
      a: 3,
      b: 'bb',
      c: 'c',
    });
  });

  test(`should support function or object array`, () => {
    const defaults = { a: 'a' };

    const options = [
      { b: 'b' },
      (o: any, { add }: { add: (a: number, b: number) => number }) => {
        o.c = add(1, 2);
      },
      (o: any) => ({
        ...o,
        d: 'd',
      }),
      { e: 'e' },
    ];
    expect(
      mergeChainedOptions({
        defaults,
        options,
        utils: {
          add: (a: number, b: number) => a + b,
        },
      }),
    ).toEqual({
      a: 'a',
      b: 'b',
      c: 3,
      d: 'd',
      e: 'e',
    });
  });

  test(`should support function and use object param`, () => {
    const defaults = { a: 'a' };

    const options = [
      { b: 'b' },
      ({
        value,
        add,
      }: {
        value: any;
        add: (a: number, b: number) => number;
      }) => {
        value.c = add(1, 2);
      },
      ({ value }: { value: any }) => ({
        ...value,
        d: 'd',
      }),
      { e: 'e' },
    ];

    expect(
      mergeChainedOptions({
        defaults,
        options,
        utils: {
          add: (a: number, b: number) => a + b,
        },
        useObjectParam: true,
      }),
    ).toEqual({
      a: 'a',
      b: 'b',
      c: 3,
      d: 'd',
      e: 'e',
    });
  });

  test('should allow false as options', () => {
    expect(
      mergeChainedOptions<'head' | false>({
        defaults: 'head',
        options: false,
        isFalsy: isNil,
      }),
    ).toBe(false);

    expect(
      mergeChainedOptions<'head' | false>({
        defaults: 'head',
        options: () => false,
        isFalsy: isNil,
      }),
    ).toBe(false);

    expect(
      mergeChainedOptions<'head' | false>({
        defaults: 'head',
        options: ['head', 'head', () => false],
        isFalsy: isNil,
      }),
    ).toBe(false);
  });
});

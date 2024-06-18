import {
  reduceConfigs,
  reduceConfigsMergeContext,
  reduceConfigsWithContext,
} from '../src';

describe('reduceConfigs', () => {
  test('should return initial config', () => {
    expect(reduceConfigs({ initial: { value: 'a' } })).toEqual({
      value: 'a',
    });
  });

  test('should merge initial config', () => {
    expect(
      reduceConfigs({
        initial: { name: 'a' },
        config: {
          name: 'b',
          custom: 'c',
        },
      }),
    ).toEqual({
      name: 'b',
      custom: 'c',
    });
  });

  test('should support custom merge function', () => {
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
      reduceConfigs({
        initial: {
          a: 1,
          b: 'b',
        },
        config: {
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

  test('should support function or object array', () => {
    const initial = { a: 'a' };

    const config = [
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
      reduceConfigsWithContext({
        initial,
        config,
        ctx: {
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

  test('should support function and merge context', () => {
    const initial = { a: 'a' };

    const config = [
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
      reduceConfigsMergeContext({
        initial,
        config,
        ctx: {
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

  test('should allow false as config', () => {
    expect(
      reduceConfigs<'head' | false>({
        initial: 'head',
        config: false,
      }),
    ).toBe(false);

    expect(
      reduceConfigs<'head' | false>({
        initial: 'head',
        config: () => false,
      }),
    ).toBe(false);

    expect(
      reduceConfigs<'head' | false>({
        initial: 'head',
        config: ['head', 'head', () => false],
      }),
    ).toBe(false);
  });
});

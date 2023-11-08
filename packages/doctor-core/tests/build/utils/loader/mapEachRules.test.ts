import { describe, it, expect } from 'vitest';
import { mapEachRules } from '@/build-utils/build/utils';

describe('test src/build/utils/loader.ts mapEachRules()', () => {
  it('string rule', () => {
    // @ts-ignore
    expect(mapEachRules(['string-rule'], (e) => e)).toStrictEqual([
      { loader: 'string-rule' },
    ]);
  });

  it('rule.loader', () => {
    expect(mapEachRules([{ loader: 'string-loader' }], (e) => e)).toStrictEqual(
      [{ loader: 'string-loader' }],
    );
  });

  it('rule.loaders', () => {
    expect(
      mapEachRules(
        [
          {
            loaders: ['string-loader-1', 'string-loader-2'],
            options: { a: 1 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        use: [{ loader: 'string-loader-1' }, { loader: 'string-loader-2' }],
        options: { a: 1 },
      },
    ]);
  });

  it('rule.use is string', () => {
    expect(
      mapEachRules(
        [
          {
            use: 'string-use',
            options: { a: 1 },
            data: { a: 2 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        use: [
          {
            loader: 'string-use',
            options: { a: 1 },
          },
        ],
        options: { a: 1 },
        data: { a: 2 },
      },
    ]);
  });

  it('rule.use is array', () => {
    expect(
      mapEachRules(
        [
          {
            use: ['string-use-1', 'string-use-2'],
            options: { a: 1 },
            data: { a: 2 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        use: [
          {
            loader: 'string-use-1',
          },
          {
            loader: 'string-use-2',
          },
        ],
        options: { a: 1 },
        data: { a: 2 },
      },
    ]);
  });

  it('rule.use is neither array or string', () => {
    expect(
      mapEachRules(
        [
          {
            use: {
              loader: 'use-loader',
            },
            options: { a: 1 },
            data: { a: 2 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        use: [
          {
            loader: 'use-loader',
          },
        ],
        options: { a: 1 },
        data: { a: 2 },
      },
    ]);
  });

  it('rule.rules', () => {
    expect(
      mapEachRules(
        [
          {
            // @ts-ignore
            rules: ['string-loader'],
            options: { a: 1 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        rules: [
          {
            loader: 'string-loader',
          },
        ],
        options: { a: 1 },
      },
    ]);
  });

  it('rule.oneOf', () => {
    expect(
      mapEachRules(
        [
          {
            // @ts-ignore
            oneOf: ['string-loader'],
            options: { a: 1 },
          },
        ],
        (e) => e,
      ),
    ).toStrictEqual([
      {
        oneOf: [
          {
            loader: 'string-loader',
          },
        ],
        options: { a: 1 },
      },
    ]);
  });
});

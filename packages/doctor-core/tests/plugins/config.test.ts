import { describe, it, expect } from 'vitest';
import { RuleSetRule } from 'webpack';
import { makeRulesSerializable } from '@/inner-plugins/utils'

describe('test src/utils/config.ts', () => {
  it('makeRulesSerializable()', async () => {
    const rules: RuleSetRule[] = [
      {
        test: /rule1/,
      },
      {
        test: /rule2/,
        oneOf: [
          {
            test: /oneof1/,
          },
          {
            test: 'aaa',
          },
        ],
        exclude: {
          and: [/exclude_and1/, /exclude_and2/],
          or: [/exclude_or/],
          not: /exclude_not/,
        },
      },
    ];

    makeRulesSerializable(rules);

    expect(JSON.stringify(rules, null, 2)).toMatchSnapshot();
  });
});

import { describe, expect, it } from 'vitest';
import { parser } from '../../src/rule-utils/parser';

describe('test src/rule-utils/parser/parser.ts', () => {
  describe('extend', () => {
    it('extend nothing', () => {
      const parser1 = parser.extend();
      const parser2 = parser.extend();

      expect(parser1 === parser2).toBeTruthy();
    });

    it('extend acorn plugin', () => {
      const parser1 = parser.extend();
      const parser2 = parser.extend((P) => class A extends P {});

      expect(parser1 === parser2).toBeFalsy();
      expect(parser.extend() === parser1).toBeFalsy();
      expect(parser.extend() === parser2).toBeTruthy();
    });
  });
});

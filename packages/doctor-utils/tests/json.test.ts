import { describe, it, expect } from 'vitest';
import { Json } from '../src/build';

describe('test src/json.ts', () => {
  describe('stringify()', () => {
    it('string & number & null & undefined & boolean', async () => {
      expect(await Json.stringify('abcde')).toEqual('"abcde"');
      expect(await Json.stringify(123)).toEqual('123');
      expect(await Json.stringify(null)).toEqual('null');
      expect(await Json.stringify(undefined)).toEqual(undefined);
      expect(await Json.stringify(true)).toEqual('true');
      expect(await Json.stringify(false)).toEqual('false');
    });

    it('Array & Object', async () => {
      expect(await Json.stringify(['abcde'])).toEqual('["abcde"]');
      expect(
        await Json.stringify(['abcde', 123, null, undefined, true, false]),
      ).toEqual('["abcde",123,null,null,true,false]');
      expect(
        await Json.stringify([
          { a: 1, b: undefined, c: null },
          1,
          [2, { k: 1 }],
        ]),
      ).toEqual('[{"a":1,"c":null},1,[2,{"k":1}]]');

      expect(await Json.stringify({ a: 1, b: undefined, c: null })).toEqual(
        '{"a":1,"c":null}',
      );
      expect(
        await Json.stringify({ a: 1, b: undefined, c: null, d: { e: 23 } }),
      ).toEqual('{"a":1,"c":null,"d":{"e":23}}');
      expect(
        await Json.stringify({
          d: { e: 23, f: null, g: undefined, h: { a: 1 } },
        }),
      ).toEqual('{"d":{"e":23,"f":null,"h":{"a":1}}}');
    });
  });
});

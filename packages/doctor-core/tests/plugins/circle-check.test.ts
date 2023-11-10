import { describe, it, expect } from 'vitest';
import { checkCirclePath } from '@/inner-plugins/utils'

describe('test checkCirclePath function', () => {
  it('makeRulesSerializable()', async () => {
    const obj: Record<string, any> = { foo: { bar: [{ x: 'y' }, { y: 'x' }], xx: { yy: 'zz' } }, a: { b: 'b' } };
    obj.foo.a = obj.foo;
    obj.foo.x = obj;
    const circlePaths: string[][] = [];

    checkCirclePath(obj, [], circlePaths, 0);
    expect(circlePaths).toMatchSnapshot();

    if (circlePaths.length > 0) {
      circlePaths.forEach((_path) => {
        if (_path?.length > 0 && obj[_path[0]] !== '[Circular]') {
          obj[_path[0]] = '[Circular]';
        }
      });
    }
    JSON.stringify(obj);
    expect(obj).toMatchSnapshot();
  });
});

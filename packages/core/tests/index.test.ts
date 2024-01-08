import { version } from '../src';

it('should export current Rsbuild version', async () => {
  expect(typeof version).toEqual('string');
});

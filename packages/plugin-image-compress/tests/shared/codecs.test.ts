import assert from 'node:assert';
import path from 'node:path';
import { fse } from '@rsbuild/shared';
import codecs from '../../src/shared/codecs';

describe('codecs', () => {
  it.each(Object.entries(codecs))(
    'should compress %s',
    async (codecName, codec) => {
      const ext = codecName.match(/[a-z]+/)?.[0];
      // TODO: fix lossy png error
      if (ext === 'png') {
        return;
      }
      assert(ext);
      const filename = path.resolve(__dirname, '../assets', `image.${ext}`);
      const oldBuf = await fse.readFile(filename);
      const newBuf = await codec.handler(oldBuf, {});
      expect(newBuf.length).lessThan(oldBuf.length);
    },
  );
});

import { describe, it, expect, afterAll } from 'vitest';
import os from 'os';
import fse from 'fs-extra';
import path from 'path';
import { File } from '../../src/build';

describe('test src/file/sharding.ts', () => {
  const tmpFolders: string[] = [];

  afterAll(async () => {
    await Promise.all(tmpFolders.map((e) => fse.remove(e)));
  });

  it('createVirtualShardingFiles()', () => {
    const sharding1 = new File.FileSharding('abcdefg', 3, 'utf-8');
    expect(sharding1.createVirtualShardingFiles()).toStrictEqual([
      { filename: '0', content: Buffer.from('abc') },
      { filename: '1', content: Buffer.from('def') },
      { filename: '2', content: Buffer.from('g') },
    ]);

    const sharding2 = new File.FileSharding('abcdefgh', 4, 'utf-8');
    expect(sharding2.createVirtualShardingFiles()).toStrictEqual([
      { filename: '0', content: Buffer.from('abcd') },
      { filename: '1', content: Buffer.from('efgh') },
    ]);

    const sharding3 = new File.FileSharding('abcdefgh', 5, 'utf-8');
    expect(sharding3.createVirtualShardingFiles()).toStrictEqual([
      { filename: '0', content: Buffer.from('abcde') },
      { filename: '1', content: Buffer.from('fgh') },
    ]);
  });

  it('writeStringToFolder()', async () => {
    const sharding = new File.FileSharding('abcdef', 3, 'utf-8');
    const tmpFolder = path.resolve(os.tmpdir(), `sharding_test_${Date.now()}`);

    tmpFolders.push(tmpFolder);

    const files = await sharding.writeStringToFolder(tmpFolder);
    const dir = await fse.readdir(tmpFolder);

    expect(dir).toHaveLength(2);
    expect(dir.length).toEqual(files.length);

    dir.forEach((e) => {
      const absPath = path.resolve(tmpFolder, e);
      const file = fse.readFileSync(absPath, 'utf-8');
      const match = files.filter((f) => f.filename === e);

      expect(match).toHaveLength(1);
      expect(match![0].content.toString()).toStrictEqual(file);
    });
  });
});

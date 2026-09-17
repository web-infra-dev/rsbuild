import type { IFsWithVolume } from 'memfs';
import { createMemoryFileSystem } from '../src/server/assets-middleware/memoryFileSystem';

test('should copy whole-file writes into exact-sized buffers, including overwrites', () => {
  const fs = createMemoryFileSystem() as IFsWithVolume;
  // Stay above the Buffer pool threshold when checking the backing allocation.
  for (const size of [Buffer.poolSize * 2 + 1, Buffer.poolSize + 1]) {
    const content = Buffer.alloc(size, 'x');
    fs.writeFileSync('/asset.js', content);
    content.fill(0);

    const stat = fs.statSync('/asset.js');
    const node = fs.__vol._core.inodes[Number(stat.ino)];
    expect(stat.size).toBe(size);
    expect(node.buf.buffer.byteLength).toBe(size);
    expect(fs.readFileSync('/asset.js')).toEqual(Buffer.alloc(size, 'x'));
  }
});

test('should preserve partial writes, existing contents and appends', () => {
  const fs = createMemoryFileSystem();
  const fd = fs.openSync('/asset.js', 'w+');
  fs.writeSync(fd, Buffer.from('abcd'), 1, 2, 2);
  fs.writeSync(fd, Buffer.from('X'), 0, 1, 0);
  fs.closeSync(fd);
  fs.appendFileSync('/asset.js', '!');
  expect(fs.readFileSync('/asset.js', 'utf8')).toBe('X\0bc!');
});

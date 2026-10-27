import { createMemoryFileSystem } from '../src/server/assets-middleware/memoryFileSystem';

test('should write whole files, including overwrites', () => {
  const fs = createMemoryFileSystem();
  for (const content of ['hello world', 'hello']) {
    const buffer = Buffer.from(content);
    fs.writeFileSync('/asset.js', buffer);

    expect(fs.statSync('/asset.js').size).toBe(buffer.length);
    expect(fs.readFileSync('/asset.js', 'utf8')).toBe(content);
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

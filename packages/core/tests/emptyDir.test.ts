import fs from 'node:fs';
import { join } from 'node:path';
import { emptyDir } from '../src/helpers/fs';

describe('emptyDir', () => {
  const testDir = join(__dirname, 'temp-emptydir-test');

  beforeEach(async () => {
    // Clean up from any previous test
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should remove empty subdirectories even when keep patterns are provided', async () => {
    // Create a test directory structure
    const subDir1 = join(testDir, 'empty-subdir');
    const subDir2 = join(testDir, 'another-empty-subdir');
    const keepFile = join(testDir, 'keep-this.txt');

    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.mkdir(subDir1, { recursive: true });
    await fs.promises.mkdir(subDir2, { recursive: true });
    await fs.promises.writeFile(keepFile, 'keep this file');

    // Verify initial structure
    expect(fs.existsSync(subDir1)).toBe(true);
    expect(fs.existsSync(subDir2)).toBe(true);
    expect(fs.existsSync(keepFile)).toBe(true);

    // Run emptyDir with a keep pattern that matches the file but not the directories
    await emptyDir(testDir, [/keep-this\.txt$/]);

    // The keep file should still exist
    expect(fs.existsSync(keepFile)).toBe(true);

    // The empty subdirectories should be removed (this is the bug - they're currently NOT removed)
    expect(fs.existsSync(subDir1)).toBe(false);
    expect(fs.existsSync(subDir2)).toBe(false);
  });

  it('should not remove directories that contain kept files', async () => {
    // Create a test directory structure
    const subDir = join(testDir, 'subdir-with-kept-file');
    const keptFile = join(subDir, 'keep-this.txt');
    const removedFile = join(subDir, 'remove-this.txt');

    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.mkdir(subDir, { recursive: true });
    await fs.promises.writeFile(keptFile, 'keep this file');
    await fs.promises.writeFile(removedFile, 'remove this file');

    // Run emptyDir with a keep pattern that matches only one file
    await emptyDir(testDir, [/keep-this\.txt$/]);

    // The subdirectory should still exist because it contains a kept file
    expect(fs.existsSync(subDir)).toBe(true);
    expect(fs.existsSync(keptFile)).toBe(true);
    expect(fs.existsSync(removedFile)).toBe(false);
  });

  it('should work correctly without keep patterns', async () => {
    // Create a test directory structure
    const subDir = join(testDir, 'subdir');
    const file = join(subDir, 'file.txt');

    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.mkdir(subDir, { recursive: true });
    await fs.promises.writeFile(file, 'test file');

    // Run emptyDir without keep patterns
    await emptyDir(testDir);

    // Everything should be removed
    expect(fs.existsSync(subDir)).toBe(false);
    expect(fs.existsSync(file)).toBe(false);
    expect(fs.existsSync(testDir)).toBe(true); // parent dir should still exist but be empty
  });
});

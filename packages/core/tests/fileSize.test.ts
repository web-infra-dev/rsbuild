import { setImmediate } from 'node:timers/promises';
import {
  createAssetProcessor,
  excludeAsset,
  normalizeFilePath,
} from '../src/plugins/fileSize';

describe('plugin-file-size', () => {
  it('should share concurrency across environments and refill completed slots', async () => {
    const processAssets = createAssetProcessor();
    const names = Array.from({ length: 32 }, (_, i) => String(i));
    const started: string[] = [];
    const release: (() => void)[] = [];
    let active = 0;
    let peak = 0;
    let drain = false;
    const visit = async (name: string) => {
      started.push(name);
      peak = Math.max(peak, ++active);
      if (!drain) {
        await new Promise<void>((resolve) => release.push(resolve));
      }
      active--;
    };

    const first = processAssets(names, (name) => visit(`first-${name}`));
    const second = processAssets(names, (name) => visit(`second-${name}`));
    expect(started).toHaveLength(16);

    release.shift()!();
    await setImmediate();
    expect(started).toHaveLength(17);

    drain = true;
    for (const resolve of release) {
      resolve();
    }
    await Promise.all([first, second]);
    expect(peak).toBe(16);
    expect(active).toBe(0);
    expect(started.toSorted()).toEqual(
      names.flatMap((name) => [`first-${name}`, `second-${name}`]).toSorted(),
    );
  });

  it('should stop reading queued assets after a failure and drain active tasks', async () => {
    const processAssets = createAssetProcessor();
    const names = Array.from({ length: 32 }, (_, i) => String(i));
    const error = new Error('Failed to read asset');
    const gate = Promise.withResolvers<void>();
    const started: string[] = [];
    let completed = 0;
    const visit = async (name: string) => {
      started.push(name);
      await gate.promise;
      if (name === '0') {
        throw error;
      }
      completed++;
    };
    const results = Promise.allSettled([
      processAssets(names, visit),
      processAssets(names, visit),
    ]);
    gate.resolve();

    expect(await results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error },
    ]);
    expect(started).toEqual(names.slice(0, 16));
    expect(completed).toBe(15);
  });

  it('#excludeAsset - should exclude asset correctly', () => {
    expect(excludeAsset({ name: 'dist/a.js', size: 1000 })).toBeFalsy();
    expect(excludeAsset({ name: 'dist/a.css', size: 1000 })).toBeFalsy();
    expect(excludeAsset({ name: 'dist/a.js.map', size: 1000 })).toBeTruthy();
    expect(excludeAsset({ name: 'dist/b.css.map', size: 1000 })).toBeTruthy();
    expect(
      excludeAsset({ name: 'dist/a.js.LICENSE.txt', size: 1000 }),
    ).toBeTruthy();
    expect(
      excludeAsset({ name: 'dist/b.css.LICENSE.txt', size: 1000 }),
    ).toBeTruthy();
    expect(excludeAsset({ name: 'dist/a.png', size: 1000 })).toBeFalsy();
    expect(excludeAsset({ name: 'dist/a.d.ts', size: 1000 })).toBeTruthy();
    expect(excludeAsset({ name: 'dist/a.d.mts', size: 1000 })).toBeTruthy();
    expect(excludeAsset({ name: 'dist/a.d.cts', size: 1000 })).toBeTruthy();
  });

  describe('#normalizeFilePath', () => {
    it('should remove 8-character hash from filename', () => {
      expect(normalizeFilePath('index.a1b2c3d4.js')).toBe('index.js');
      expect(normalizeFilePath('styles.12345678.css')).toBe('styles.css');
    });

    it('should remove longer hash patterns (16+ characters)', () => {
      // Valid hex digits only (a-f, 0-9)
      expect(normalizeFilePath('main.1234567890abcdef.js')).toBe('main.js');
      expect(normalizeFilePath('bundle.abc123def456.js')).toBe('bundle.js');
    });

    it('should handle adjacent hashes (overlapping dots)', () => {
      // Note: Due to overlapping match (shared dot), only first hash is removed
      // This is fine - real build tools don't generate filenames like this
      expect(normalizeFilePath('chunk.abc12345.def67890.js')).toBe(
        'chunk.def67890.js',
      );

      // Non-overlapping hashes work correctly
      expect(normalizeFilePath('chunk.abc12345.min.def67890.js')).toBe(
        'chunk.min.js',
      );
    });

    it('should not remove non-hex sequences', () => {
      // Contains 'g' and 'h' which are not hex digits
      expect(normalizeFilePath('bundle.a1b2c3d4e5f6g7h8.js')).toBe(
        'bundle.a1b2c3d4e5f6g7h8.js',
      );
      expect(normalizeFilePath('file.xyz12345.js')).toBe('file.xyz12345.js');
    });

    it('should preserve filename without hash', () => {
      expect(normalizeFilePath('icon.png')).toBe('icon.png');
      expect(normalizeFilePath('index.html')).toBe('index.html');
      expect(normalizeFilePath('app.js')).toBe('app.js');
    });

    it('should handle filenames with path separators', () => {
      expect(normalizeFilePath('static/js/index.a1b2c3d4.js')).toBe(
        'static/js/index.js',
      );
      expect(normalizeFilePath('dist/css/main.12345678.css')).toBe(
        'dist/css/main.css',
      );
    });

    it('should not remove short sequences that look like hashes', () => {
      // Less than 8 characters should not be removed
      expect(normalizeFilePath('file.abc123.js')).toBe('file.abc123.js');
      expect(normalizeFilePath('test.1234567.css')).toBe('test.1234567.css');
    });

    it('should handle uppercase hex digits', () => {
      expect(normalizeFilePath('bundle.A1B2C3D4.js')).toBe(
        'bundle.A1B2C3D4.js',
      );
      // Only lowercase a-f are matched by the regex
    });

    it('should handle edge cases', () => {
      // Hash at the beginning (unlikely but possible)
      expect(normalizeFilePath('12345678.main.js')).toBe('12345678.main.js');
      // Multiple extensions
      expect(normalizeFilePath('app.min.a1b2c3d4.js')).toBe('app.min.js');
      // No extension
      expect(normalizeFilePath('LICENSE')).toBe('LICENSE');
    });
  });
});

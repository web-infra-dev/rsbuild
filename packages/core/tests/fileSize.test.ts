import { excludeAsset } from '../src/plugins/fileSize';

describe('plugin-file-size', () => {
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
  });
});

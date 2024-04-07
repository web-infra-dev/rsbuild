import { createStubRsbuild } from './helper';
import { pluginProgress } from '../src/plugins/progress';
import { createFriendlyPercentage } from '../src/progress/helpers';

describe('plugin-progress', () => {
  it('should register ProgressPlugin by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginProgress()],
    });

    const matched = await rsbuild.matchBundlerPlugin('ProgressPlugin');
    expect(matched).toBeTruthy();
  });

  it('should not register ProgressPlugin if dev.progressBar is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginProgress()],
      rsbuildConfig: {
        dev: {
          progressBar: false,
        },
      },
    });

    const matched = await rsbuild.matchBundlerPlugin('ProgressPlugin');
    expect(matched).toBeFalsy();
  });
});

describe('createFriendlyPercentage', () => {
  it('should format percentage correctly', () => {
    const friendlyPercentage = createFriendlyPercentage();

    expect(friendlyPercentage(0)).toBe(0);
    expect(friendlyPercentage(0.01)).toBe(0.01);
    expect(friendlyPercentage(0.01)).toBe(0.011);
    expect(friendlyPercentage(0.4)).toBe(0.4);
    expect(friendlyPercentage(0.7)).toBe(0.7);
    expect(friendlyPercentage(0.7)).toBe(0.704);
    expect(friendlyPercentage(0.9)).toBe(0.9);
    expect(friendlyPercentage(0.9)).toBe(0.902);
    expect(friendlyPercentage(1)).toBe(1);
    expect(friendlyPercentage(0)).toBe(0);
  });
});

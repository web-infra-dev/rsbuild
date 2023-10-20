import { getAntdMajorVersion } from '@modern-js/utils';
import type { RsbuildTarget, DefaultRsbuildPlugin } from '@rsbuild/shared';

export const pluginAntd = (): DefaultRsbuildPlugin => ({
  name: `plugin-antd`,

  setup(api) {
    api.modifyRsbuildConfig((rsbuildConfig) => {
      rsbuildConfig.source ??= {};

      if (
        rsbuildConfig.source.transformImport === false ||
        rsbuildConfig.source.transformImport?.some(
          (item) => item.libraryName === 'antd',
        )
      ) {
        return;
      }

      const antdMajorVersion = getAntdMajorVersion(api.context.rootPath);
      // antd >= v5 no longer need babel-plugin-import
      // see: https://ant.design/docs/react/migration-v5#remove-babel-plugin-import
      if (antdMajorVersion && antdMajorVersion < 5) {
        rsbuildConfig.source ??= {};
        rsbuildConfig.source.transformImport = [
          ...(rsbuildConfig.source.transformImport || []),
          {
            libraryName: 'antd',
            libraryDirectory: useSSR(api.context.target) ? 'lib' : 'es',
            style: true,
          },
        ];
      }
    });
  },
});

export function useSSR(target: RsbuildTarget | RsbuildTarget[]) {
  return (Array.isArray(target) ? target : [target]).some((item) =>
    ['node', 'service-worker'].includes(item),
  );
}

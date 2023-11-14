import { Linter, SDK } from '@rsbuild/doctor-types';
import { Loader, Time } from '@rsbuild/doctor-utils/common';
import { defineRule } from '../../rule';
import { Config, LoaderMapValue } from './types';
import { match } from './utils';

export type { Config } from './types';

const title = 'loader-performance-optimization';

export const rule = defineRule<typeof title, Config>(() => {
  return {
    meta: {
      code: 'E1003' as const,
      title,
      category: 'compile',
      severity: Linter.Severity.Warn,
      defaultConfig: {
        ignore: [],
        threshold: 5000,
        extensions: ['js', 'css', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      },
    },
    check({ loader, configs, root, ruleConfig, report }) {
      const { extensions, ignore, threshold } = ruleConfig;

      if (extensions.length === 0) return;

      if (loader.length === 0) return;

      const { config } = configs.find((e) => e.name === 'webpack')!;
      const cwd = config.context || root;

      const nodeModulesPathRegexp = /\/node_modules\//;

      const resultMap: Map<string, Array<LoaderMapValue>> = new Map();

      // flatten loaders
      const loaders: SDK.LoaderTransformData[] = loader
        .map((el) => el.loaders)
        .reduce((t, c) => t.concat(c));

      for (const item of loader) {
        const { path, ext } = item.resource;

        if (!match(ext, extensions)) continue;

        // node_modules file or outof cwd file
        if (nodeModulesPathRegexp.test(path) || !path.startsWith(cwd)) {
          item.loaders.forEach((el) => {
            if (match(el.loader, ignore)) return;

            const costs = Loader.getLoaderCosts(el, loaders);

            const v: LoaderMapValue = {
              ...el,
              __resource__: item.resource,
              __costs__: costs,
            };

            if (resultMap.has(el.loader)) {
              resultMap.get(el.loader)!.push(v);
            } else {
              resultMap.set(el.loader, [v]);
            }
          });
        }
      }

      const sum = (arr: LoaderMapValue[]) => {
        const v1 = arr.reduce((t, c) => t + c.__costs__, 0);
        const v2 =
          Math.max.apply(
            null,
            arr.map((e) => e.endAt),
          ) - Math.min.apply(arr.map((e) => e.startAt));

        if (v2 >= v1) return v1;
        return v2;
      };

      for (const [loaderName, v] of resultMap.entries()) {
        const nodeModulesFiles = v.filter((e) =>
          nodeModulesPathRegexp.test(e.__resource__.path),
        );
        const nodeModulesFilesCosts = sum(nodeModulesFiles);
        const outofCwdFiles = v.filter(
          (e) => !e.__resource__.path.startsWith(cwd),
        );
        const outofCwdFilesCosts = sum(outofCwdFiles);

        const msg = [
          nodeModulesFilesCosts >= threshold &&
            `<b>${
              nodeModulesFiles.length
            }</b> node_modules files(costs: <b>${Time.formatCosts(
              nodeModulesFilesCosts,
            )}</b>)`,
          outofCwdFilesCosts >= threshold &&
            `<b>${
              outofCwdFiles.length
            }</b> outof project files(costs: <b>${Time.formatCosts(
              outofCwdFilesCosts,
            )}</b>)`,
        ]
          .filter(Boolean)
          .join(' and ');

        if (msg) {
          const message = `<b>${loaderName}</b> has process ${msg}.`;
          report({
            message,
            detail: {
              description: message,
              type: 'link',
              // nodeModulesFiles,
              // outofCwdFiles,
            },
          });
        }
      }
    },
  };
});

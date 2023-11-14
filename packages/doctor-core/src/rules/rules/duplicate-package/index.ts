import { Linter, Rule } from '@rsbuild/doctor-types';
import { gt, diff } from 'semver';
import { Config, CheckVersionMap } from './types';
import { getErrorMsg, getErrorDetail } from './utils';
import { defineRule } from '../../rule';

export type { Config, CheckVersion } from './types';

const title = 'duplicate-package';

export const rule = defineRule<typeof title, Config>(() => ({
  meta: {
    code: 'E1001' as const,
    title,
    category: 'bundle',
    severity: Linter.Severity.Warn,
    defaultConfig: {
      checkVersion: 'major',
      ignore: [],
    },
  },
  check({ packageGraph, report, root, ruleConfig }) {
    const checkVersion = CheckVersionMap[ruleConfig.checkVersion];
    const packages = packageGraph
      .getDuplicatePackages()
      .filter((pkg) => !ruleConfig.ignore.includes(pkg[0].name))
      .map((pkgs) => {
        return pkgs
          .filter((current) => {
            // The current version and all versions are different by bit.
            const check = pkgs.reduce(
              // eslint-disable-next-line no-bitwise
              (ans, pkg) =>
                ans |
                CheckVersionMap[diff(current.version, pkg.version) ?? 'null'],
              0,
            );
            return check <= checkVersion;
          })
          .sort((_packA, _packB) =>
            gt(_packA.version, _packB.version) ? 1 : -1,
          );
      })
      .filter((pkgs) => pkgs.length > 1);

    for (const pkg of packages) {
      const message = getErrorMsg(pkg, root);
      const detail: Linter.ReportDetailData<Rule.PackageRelationDiffRuleStoreData> =
        {
          type: 'package-relation',
          packages: pkg.map((item) => getErrorDetail(item, packageGraph)),
        };

      report({
        message,
        detail,
      });
    }
  },
}));

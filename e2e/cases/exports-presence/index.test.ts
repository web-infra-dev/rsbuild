import { expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

// TODO: needs rspack exportsPresence error
// https://github.com/web-infra-dev/rspack/issues/4323
webpackOnlyTest(
  'should throw error by default(exportsPresence error)',
  async () => {
    await expect(
      build({
        cwd: __dirname,
      }),
    ).rejects.toThrowError();
  },
);

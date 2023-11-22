import { defineRule } from '@rsbuild/doctor-core/rules';
import { Rule } from '@rsbuild/doctor-types';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import path from 'path';
import { test, expect } from '@playwright/test';
import { createRsbuildDoctorPlugin } from '../test-utils';

async function webpack(compile: typeof compileByWebpack5) {
  let checkFnTimes = 0;
  let checkEndFnTimes = 0;
  let checkEndAfterManifestFnTimes = 0;
  const file = path.resolve(__dirname, '../fixtures/b.js');
  const result = await compile(file, {
    optimization: {
      minimize: true,
    },
    plugins: [
      // @ts-ignore
      createRsbuildDoctorPlugin({
        linter: {
          extends: [
            defineRule(() => ({
              meta: {
                code: Rule.RuleMessageCodeEnumerated.Extend,
                title: 'test' as const,
                category: 'bundle',
                severity: 'Warn',
              },
              check() {
                checkFnTimes += 1;
              },
              async onCheckEnd({ hooks }) {
                hooks.afterSaveManifest.tapPromise('CCC', async () => {
                  checkEndAfterManifestFnTimes += 1;
                });
                checkEndFnTimes += 1;
              },
            })),
          ],
        },
      }),
    ],
  });

  return {
    result,
    checkFnTimes,
    checkEndFnTimes,
    checkEndAfterManifestFnTimes,
  };
}

test('webpack5', async () => {
  const { checkEndAfterManifestFnTimes, checkEndFnTimes, checkFnTimes } =
    await webpack(compileByWebpack5);
  expect(checkFnTimes).toBe(1);
  expect(checkEndFnTimes).toBe(1);
  expect(checkEndAfterManifestFnTimes).toBe(1);
});

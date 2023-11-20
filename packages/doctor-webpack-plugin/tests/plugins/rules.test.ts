import { defineRule } from '@rsbuild/doctor-core/rules';
import { Rule } from '@rsbuild/doctor-types';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { createRsbuildDoctorPlugin } from '../test-utils';
// TODO: migrate to e2e
describe('test src/plugins/rules.ts', () => {
  async function webpack(compile: typeof compileByWebpack5) {
    const check = vi.fn();
    const onCheckEnd = vi.fn();
    const onCheckEndAfterManifest = vi.fn();

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
                  check('check');
                },
                async onCheckEnd({ hooks }) {
                  hooks.afterSaveManifest.tapPromise('aaa', async () => {
                    onCheckEndAfterManifest('onCheckEndAfterManifest');
                  });
                  onCheckEnd('onCheckEnd');
                },
              })),
            ],
          },
        }),
      ],
    });

    return {
      result,
      check,
      onCheckEnd,
      onCheckEndAfterManifest,
    };
  }

  it.skip('webpack5', async () => {
    const { check, onCheckEnd, onCheckEndAfterManifest } =
      await webpack(compileByWebpack5);

    expect(check).toBeCalledTimes(1);
    expect(check).toHaveBeenNthCalledWith(1, 'check');
    expect(onCheckEnd).toBeCalledTimes(1);
    expect(onCheckEnd).toHaveBeenNthCalledWith(1, 'onCheckEnd');
    // expect(onCheckEndAfterManifest).toBeCalledTimes(1); // TODO: check this
    expect(onCheckEndAfterManifest).toHaveBeenNthCalledWith(
      1,
      'onCheckEndAfterManifest',
    );
  });
});

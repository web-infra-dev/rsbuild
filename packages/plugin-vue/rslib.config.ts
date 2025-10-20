import fs from 'node:fs';
import path from 'node:path';
import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig, rsbuild } from '@rslib/core';

const pluginTrimVueLoaderPackageJson: rsbuild.RsbuildPlugin = {
  name: 'trim-vue-loader-package-json',
  setup(api) {
    api.onBeforeBuild(() => {
      const cwd = process.cwd();
      const sourceRoot = path.join(cwd, 'node_modules/vue-loader');
      const targetRoot = path.join(cwd, 'compiled/vue-loader');

      fs.rmSync(targetRoot, { recursive: true, force: true });

      fs.cpSync(path.join(sourceRoot, 'dist'), path.join(targetRoot, 'dist'), {
        recursive: true,
      });

      for (const file of ['package.json', 'LICENSE']) {
        fs.copyFileSync(
          path.join(sourceRoot, file),
          path.join(targetRoot, file),
        );
      }
    });

    api.onAfterBuild(() => {
      const pkgPath = path.join(
        process.cwd(),
        'compiled/vue-loader/package.json',
      );
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const fields = ['name', 'author', 'version', 'funding', 'license'];
      const trimmed = Object.fromEntries(
        fields
          .filter((field) => field in pkgJson)
          .map((field) => [field, pkgJson[field]]),
      );
      fs.writeFileSync(
        pkgPath,
        `${JSON.stringify(trimmed, null, 2)}\n`,
        'utf8',
      );
    });
  },
};

export default defineConfig(
  rsbuild.mergeRsbuildConfig(dualPackage, {
    lib: [],
    plugins: [pluginTrimVueLoaderPackageJson],
  }),
);

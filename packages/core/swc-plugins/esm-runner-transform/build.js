import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// cspell:ignore rustup wasip
const pluginDir = path.dirname(fileURLToPath(import.meta.url));
const target = 'wasm32-wasip1';

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: pluginDir,
    stdio: 'inherit',
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error(
        `Cannot build the ESM runner transform because ${command} is not installed. Install Rust with rustup and try again.`,
      );
    }
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run('rustup', ['target', 'add', target]);
run('cargo', ['build', '--locked', '--release', '--target', target]);

copyFileSync(
  path.join(
    pluginDir,
    'target',
    target,
    'release',
    'rsbuild_swc_esm_runner_transform.wasm',
  ),
  path.resolve(pluginDir, '../../static/swc-esm-runner-transform.wasm'),
);

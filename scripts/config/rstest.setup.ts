import path from 'node:path';
import { beforeAll, expect } from 'rstack/test';
import { createSnapshotSerializer } from 'path-serializer';

const repoRoot = path.join(__dirname, '../..');

const GLOBAL_VIRTUAL_STORE_PATH =
  /(?:file:\/{2})?(?:[a-zA-Z]:)?\/(?:[^/"'\r\n]+\/)*v\d+\/links\/.+?\/node_modules(?=\/)/g;

process.chdir(repoRoot);

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD =
    'filepath' in suite ? path.dirname(suite.filepath) : '';
});

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    root: repoRoot,
    workspace: path.join(__dirname, '..'),
    replace: [
      {
        // TODO: Remove after path-serializer supports custom store directories.
        // https://github.com/rstackjs/path-serializer/pull/27
        match: GLOBAL_VIRTUAL_STORE_PATH,
        mark: 'pnpm-inner',
      },
    ],
  }),
);

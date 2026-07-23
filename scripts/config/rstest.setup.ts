import path from 'node:path';
import { beforeAll, expect } from 'rstack/test';
import { createSnapshotSerializer } from 'path-serializer';

const repoRoot = path.join(__dirname, '../..');

process.chdir(repoRoot);

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD = 'filepath' in suite ? path.dirname(suite.filepath) : '';
});

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    root: repoRoot,
    workspace: path.join(__dirname, '..'),
  }),
);

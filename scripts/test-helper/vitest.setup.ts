import path from 'node:path';
import { createSnapshotSerializer } from 'path-serializer';
import { beforeAll, expect } from 'vitest';

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD =
    'filepath' in suite ? path.dirname(suite.filepath) : '';
});

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);

import path from 'path';
import { expect, beforeAll } from 'vitest';
import { createSnapshotSerializer } from './dist';

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD = suite.filepath
    ? path.dirname(suite.filepath)
    : '';
});

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);

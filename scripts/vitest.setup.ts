import path from 'path';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@rsbuild/vitest-helper';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);

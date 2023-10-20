import path from 'path';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@rsbuild/test-helper';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);

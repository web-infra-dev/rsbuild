import path from 'path';
import { expect } from 'vitest';
import { createSnapshotSerializer } from './dist';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);

import type { Chunk, ChunkGroup } from '@rspack/core';
import { recursiveChunkEntryNames } from '../src/rspack-plugins/resource-hints/doesChunkBelongToHtml';

const createGroup = (
  name: string | undefined,
  parents: ChunkGroup[] = [],
): ChunkGroup => ({ name, getParents: () => parents }) as ChunkGroup;

test('should preserve entry names across shared and cyclic chunk groups', () => {
  const firstEntry = createGroup('first');
  const secondEntry = createGroup('second');
  const parents: ChunkGroup[] = [firstEntry];
  const firstGroup = createGroup('async-first', parents);
  const sharedGroup = createGroup('async-shared', [secondEntry, firstGroup]);
  parents.push(sharedGroup);

  const secondGroup = createGroup('async-second', [
    sharedGroup,
    createGroup('first'),
    createGroup(undefined),
  ]);

  expect(
    recursiveChunkEntryNames({
      groupsIterable: new Set([firstGroup, secondGroup]),
    } as unknown as Chunk),
  ).toEqual(['first', 'second']);
});

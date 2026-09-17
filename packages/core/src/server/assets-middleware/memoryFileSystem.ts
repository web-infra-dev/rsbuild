import { Node, Superblock } from '@jsonjoy.com/fs-core';
import { createFsFromVolume, type IFs, Volume } from 'memfs';

/**
 * Rspack usually writes each asset as one complete Buffer. Rebuilds overwrite
 * files with writeFile, which truncates them and releases their old buffers,
 * so spare capacity from the previous build cannot be reused.
 *
 * memfs's power-of-two growth helps incremental appends, but wastes memory for
 * these whole-file writes (e.g. a 5 MiB asset reserves 8 MiB). Copying into an
 * exact-sized buffer avoids that unused capacity on both initial builds and
 * rebuilds. Other writes retain memfs's normal growth behavior.
 */
function write(
  this: Node,
  buffer: Buffer,
  offset = 0,
  length = buffer.length,
  position = 0,
): number {
  if (
    this.getSize() === 0 &&
    position === 0 &&
    offset === 0 &&
    length === buffer.length &&
    length > 0
  ) {
    // Copy the input and keep the inode's metadata/events so links, descriptors
    // and watchers agree.
    this.setBuffer(buffer);
    return length;
  }

  return Node.prototype.write.call(this, buffer, offset, length, position);
}

class OutputSuperblock extends Superblock {
  override createNode(mode: number): Node {
    const node = super.createNode(mode);
    node.write = write;
    return node;
  }
}

export function createMemoryFileSystem(): IFs {
  return createFsFromVolume(new Volume(new OutputSuperblock()));
}

import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';

export class FileSharding {
  constructor(
    protected content: string,
    protected limitBytes = 1024 * 1024 * 10,
    protected encoding: BufferEncoding = 'utf-8',
  ) {}

  /**
   * @param ext the extension name of the output file (must starts with ".")
   */
  public createVirtualShardingFiles(ext = '') {
    const bf = Buffer.from(this.content, this.encoding);
    const res: Buffer[] = [];
    const threshold = this.limitBytes;

    let tmpBytes = 0;
    while (bf.byteLength > tmpBytes) {
      res.push(bf.subarray(tmpBytes, tmpBytes + threshold));
      tmpBytes += threshold;
    }

    return res.map((e, i) => ({ filename: `${i}${ext}`, content: e }));
  }

  /**
   * @param folder absolute path of folder which used to save string sharding files.
   * @param ext the extension name of the output file (must starts with ".")
   */
  public async writeStringToFolder(folder: string, ext = '') {
    const dist = path.resolve(folder);
    await fse.ensureDir(dist);
    const res = this.createVirtualShardingFiles(ext);

    await Promise.all(
      res.map(
        (e) =>
          new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(
              path.join(dist, e.filename),
              this.encoding,
            );
            stream.end(e.content);
            stream.once('close', () => resolve(undefined));
            stream.once('error', (err) => reject(err));
          }),
      ),
    );

    return res;
  }
}

import { JsonStreamStringify } from 'json-stream-stringify';
import { PassThrough } from 'stream';

export function stringify<T, P = T extends undefined ? undefined : string>(
  json: T,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number,
  cycle?: boolean,
): Promise<P> {
  if (json && typeof json === 'object') {
    return new Promise((resolve, reject) => {
      let res = '';
      const pt = new PassThrough();
      const stream = new JsonStreamStringify(json, replacer, space, cycle);

      pt.on('data', (chunk) => {
        res += chunk;
      });

      pt.on('end', () => {
        return resolve(res as P);
      });

      pt.on('error', (err) => {
        return reject(err);
      });

      stream.on('error', (err) => {
        return reject(err);
      });

      stream.pipe(pt);
    });
  }

  return Promise.resolve(JSON.stringify(json, replacer, space) as P);
}

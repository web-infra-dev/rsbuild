import { dedupeCleanPaths } from '../src/plugins/cleanOutput';

describe('cleanOutput', () => {
  test('should dedupeCleanPaths correctly', async () => {
    expect(
      dedupeCleanPaths([
        'package/to/root/dist/web1',
        'package/to/root/dist/web2',
        'package/to/root/dist',
      ]),
    ).toEqual(['package/to/root/dist']);

    expect(
      dedupeCleanPaths([
        'package/to/root',
        'package/to/root/dist/web2',
        'package/to/root/dist',
      ]),
    ).toEqual(['package/to/root']);

    expect(
      dedupeCleanPaths([
        'package/to/root/dist/web1',
        'package/to/root/dist/web2',
        'package/to/root/dist/web3',
        'package/to/root/dist/web3',
      ]),
    ).toEqual([
      'package/to/root/dist/web1',
      'package/to/root/dist/web2',
      'package/to/root/dist/web3',
    ]);
  });
});

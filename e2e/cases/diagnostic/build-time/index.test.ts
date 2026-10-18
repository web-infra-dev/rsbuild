import { stripVTControlCharacters } from 'node:util';
import { expect, test } from '@e2e/helper';

const EXPECTED_LOG = /built in (?:[\d.]+s|\d+m(?: [\d.]+s)?)/;

test('should print build time', async ({ runBoth }) => {
  await runBoth(async ({ mode, result }) => {
    await result.expectLog(EXPECTED_LOG);

    if (mode === 'build') {
      const output = stripVTControlCharacters(
        result.originalLogs.join(''),
      ).trim();
      const fileSizeIndex = output.lastIndexOf('File (web)');
      expect(fileSizeIndex).toBeGreaterThan(-1);
      expect(output.lastIndexOf('built in')).toBeGreaterThan(fileSizeIndex);
      expect(output).toMatch(new RegExp(`${EXPECTED_LOG.source}$`));
    }
  });
});

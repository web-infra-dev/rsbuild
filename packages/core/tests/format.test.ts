import { resolve } from 'node:path';
import { formatStatsError } from '../src/helpers/format';
import { createLogger } from '../src/logger';

const root = resolve('/project/a/b/c/d');
const logger = createLogger({ level: 'info' });

describe('diagnostic paths', () => {
  it.each([
    ['../../../dependency.js', '../../../dependency.js:1:1'],
    ['../../../../dependency.js', `${resolve('/project/dependency.js')}:1:1`],
    ['../../../../../dependency.js:2:3', `${resolve('/dependency.js')}:2:3`],
  ])('should format %s as %s', (file, expected) => {
    expect(formatStatsError({ file, message: '' }, root, 'error', logger)).toBe(
      `File: ${expected}`,
    );
  });

  it('should format long relative paths in import traces', () => {
    const file = '../../../../dependency.js';
    const message = formatStatsError(
      {
        moduleName: file,
        message: '',
        moduleTrace: [{ originName: '../../../shared.js' }],
      },
      root,
      'error',
      logger,
    );

    expect(message).toContain(
      'Import traces (entry → error):\n' +
        '  ../../../shared.js\n' +
        `  ${resolve('/project/dependency.js')} ×`,
    );
  });
});

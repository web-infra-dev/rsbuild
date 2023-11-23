import { normalizeConfig } from '@/config/normalize';

describe('normalizeConfig', () => {
  it('should normalize config correctly', () => {
    const normalized = normalizeConfig({
      source: { preEntry: 'foo' },
      server: { compress: true },
    });
    expect(normalized.source.preEntry).toEqual(['foo']);
    expect(normalized.server.compress).toEqual(true);
    expect(normalized.output.distPath).toBeDefined();
  });
});

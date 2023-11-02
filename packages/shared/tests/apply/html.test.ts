import { getTemplatePath, RsbuildConfig, NormalizedConfig } from '../../src';

describe('apply/html', () => {
  it.each<[string, string, RsbuildConfig['html']]>([
    ['main', 'foo', { template: 'foo' }],
    ['main', 'foo', { templateByEntries: { main: 'foo' } }],
    ['other', 'bar', { template: 'bar', templateByEntries: { main: 'foo' } }],
  ])(`should get template path for %s`, async (entry, expected, html) => {
    const templatePath = getTemplatePath(entry, {
      html,
    } as NormalizedConfig);
    expect(templatePath).toEqual(expected);
  });
});

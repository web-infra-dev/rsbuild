import {
  getTemplatePath,
  SharedRsbuildConfig,
  SharedNormalizedConfig,
} from '../../src';

describe('apply/html', () => {
  it.each<[string, string, SharedRsbuildConfig['html']]>([
    ['main', 'foo', { template: 'foo' }],
    ['main', 'foo', { templateByEntries: { main: 'foo' } }],
    ['other', 'bar', { template: 'bar', templateByEntries: { main: 'foo' } }],
  ])(`should get template path for %s`, async (entry, expected, html) => {
    const templatePath = getTemplatePath(entry, {
      html,
    } as SharedNormalizedConfig);
    expect(templatePath).toEqual(expected);
  });
});

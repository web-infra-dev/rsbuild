import { getMetaTags } from '@src/plugins/html';

it('should generate meta tags correctly', async () => {
  const rsbuildConfig = {
    html: {
      meta: { description: 'This is basic meta', bar: 'bar', foo: 'foo' },
    },
    output: {} as any,
  };

  const defaultEntry = await getMetaTags('', rsbuildConfig);
  expect(defaultEntry).toMatchSnapshot();

  const entry1 = await getMetaTags('entry1', rsbuildConfig);
  expect(entry1).toMatchSnapshot();
});

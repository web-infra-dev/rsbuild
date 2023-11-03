import { generateMetaTags } from '../src/utils/generateMetaTags';

describe('generateMetaTags', () => {
  it('should return empty string when params is empty', () => {
    expect(generateMetaTags()).toEqual([]);
  });

  it('should generate meta tag correctly', () => {
    const options = {
      foo: {
        name: 'viewport',
        content: 'width=500, initial-scale=1',
      },
    };
    expect(generateMetaTags(options)).toEqual([
      {
        attributes: {
          content: 'width=500, initial-scale=1',
          name: 'viewport',
        },
        meta: {},
        tagName: 'meta',
        voidTag: true,
      },
    ]);
  });
});

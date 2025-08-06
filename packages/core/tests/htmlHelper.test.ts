import type { NormalizedConfig } from '../src';
import { getHTMLPathByEntry } from '../src/initPlugins';
import { hasTitle } from '../src/rspack-plugins/RsbuildHtmlPlugin';

test('should detect HTML title via "hasTitle" correctly', () => {
  expect(hasTitle()).toEqual(false);
  expect(hasTitle('<title></title>')).toEqual(true);
  expect(hasTitle('<title>hello</title>')).toEqual(true);
  expect(hasTitle('<title  ></title>')).toEqual(true);
  expect(hasTitle('<title></title  >')).toEqual(true);
  expect(hasTitle('<title >hello</title  >')).toEqual(true);
  expect(hasTitle('<html><head></head><body></body></html>')).toEqual(false);
  expect(
    hasTitle(
      '<html><head><title>Page Title</title></head><body></body></html>',
    ),
  ).toEqual(true);
  expect(
    hasTitle(
      '<html>\n<head>\n<title>\nPage Title\n</title>\n</head>\n<body></body>\n</html>',
    ),
  ).toEqual(true);
});

describe('getHTMLPathByEntry', () => {
  it('should use distPath.html as the folder', async () => {
    const htmlPath = getHTMLPathByEntry('main', {
      output: {
        distPath: {
          html: 'my-html',
        },
        filename: {},
      },
      html: {
        outputStructure: 'nested',
      },
    } as NormalizedConfig);

    expect(htmlPath).toEqual('my-html/main/index.html');
  });

  it('should allow to disable html folder', async () => {
    const htmlPath = getHTMLPathByEntry('main', {
      output: {
        distPath: {
          html: 'html',
        },
        filename: {},
      },
      html: {
        outputStructure: 'flat',
      },
    } as NormalizedConfig);

    expect(htmlPath).toEqual('html/main.html');
  });
});

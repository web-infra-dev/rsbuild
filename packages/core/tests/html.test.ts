import { hasTitle } from '@src/rspack/HtmlBasicPlugin';

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

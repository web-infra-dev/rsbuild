const POLYFILL_RE = /\/lib-polyfill/;

export const getPolyfillContent = (files: Record<string, string>) => {
  const polyfillFileName = Object.keys(files).find(
    (file) => POLYFILL_RE.test(file) && file.endsWith('.js.map'),
  );

  const indexFileName = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js.map'),
  )!;

  const content = polyfillFileName
    ? files[polyfillFileName]
    : files[indexFileName];
  return content;
};

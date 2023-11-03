import pug from 'pug';
import type { Rspack } from '@rsbuild/shared';
import type { Options } from 'pug';

export default function (this: Rspack.LoaderContext<Options>, source: string) {
  const options = {
    filename: this.resourcePath,
    doctype: 'html',
    compileDebug: false,
    ...this.getOptions(),
  };

  const templateCode = pug.compileClient(source, options);
  return `${templateCode}; module.exports = template;`;
}

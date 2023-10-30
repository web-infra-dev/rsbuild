import pug from '@rsbuild/shared/pug';
import type { PugOptions } from '@rsbuild/shared';
import type { webpack } from '../types';

export default function (
  this: webpack.LoaderContext<PugOptions>,
  source: string,
) {
  const options = {
    filename: this.resourcePath,
    doctype: 'html',
    compileDebug: false,
    ...this.getOptions(),
  };

  const templateCode = pug.compileClient(source, options);
  return `${templateCode}; module.exports = template;`;
}

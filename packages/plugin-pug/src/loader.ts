import pug from 'pug';
import type { Rspack } from '@rsbuild/shared';
import type { Options } from 'pug';

const VUE_SFC_REGEXP = /\.vue$/;

export default function (this: Rspack.LoaderContext<Options>, source: string) {
  const options = {
    filename: this.resourcePath,
    doctype: 'html',
    compileDebug: false,
    ...this.getOptions(),
  };

  // Compile pug to HTML for Vue compiler
  if (VUE_SFC_REGEXP.test(this.resourcePath)) {
    const template = pug.compile(source, options);
    const { dependencies } = template as unknown as { dependencies: string[] };

    if (dependencies) {
      dependencies.forEach(this.addDependency);
    }

    return template();
  }

  // Compile pug to JavaScript for html-webpack-plugin
  const templateCode = pug.compileClient(source, options);
  return `${templateCode}; module.exports = template;`;
}

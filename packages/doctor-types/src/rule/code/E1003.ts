import { RuleMessage } from './type';

export const code = 'E1003';

export const message: RuleMessage = {
  code,
  title: 'Loader Performance Optimization',
  type: 'markdown',
  category: 'compile',
  description: `
#### Description

Usually the slow compile of most projects is due to the slow execution of the loaders.

And the loaders always pre-process many unnecessary files, such as \`node_modules files\` and \`already compiled files\`.

#### General Solution

Set \`exclude\` to the \`module.rules\` of webpack configuration for target loader.

For example, if \`node_modules/lodash\` is processed by the \`babel-loader\` that make the compile slowly:

\`\`\`
{
  module: {
    rules: [
      {
        test: /\\.js$/,
        use: 'babel-loader',
        exclude: [
          /node_modules\\/lodash/
        ]
      }
    ]
  }
}
\`\`\`
`,
};

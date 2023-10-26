import { RuleMessage } from './type';

export const code = 'E1001';

export const message: RuleMessage = {
  code,
  title: 'Duplicate Packages',
  type: 'markdown',
  category: 'bundle',
  description: `
#### Description

there is a same name package which bundled more than one version in your application.

it is not good to the bundle size of your application.

#### General Solution

add an entry in \`resolve.alias\` which will configure Webpack to route any package references to a single specified path.

For example, if \`lodash\` is duplicated in your bundle, the following configuration would render all Lodash imports to always refer to the \`lodash\` instance found at \`./node_modules/lodash\`:

\`\`\`js
{
  alias: {
    lodash: path.resolve(__dirname, 'node_modules/lodash')
  }
}
\`\`\`
`,
};

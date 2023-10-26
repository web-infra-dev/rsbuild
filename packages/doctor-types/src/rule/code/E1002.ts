import { RuleMessage } from './type';

export const code = 'E1002';

export const message: RuleMessage = {
  code,
  title: 'Default Import Check',
  type: 'markdown',
  category: 'compile',
  description: `
#### Description

Usually webpack will automatically compatible different modules that has different types, but in a special case, the operation of compatibility will fail.
That is, when you use \`Default Import\` to import a cjs module, and this cjs module do not have the compatible statement, such as \`exports.default = \`.

#### General Solution

1. for cjs module, write a \`exports.default = \` statement for default export.
2. use \`Namespace Import\` for import the cjs module.

For example, for the package \`htmlparser2@7.2.0\`:

\`\`\`ts
// you should use this
import * as Parser from 'htmlparser2';

// can not use this
import Parser from 'htmlparser2';
\`\`\`
`,
};

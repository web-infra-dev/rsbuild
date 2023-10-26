import { RuleMessage } from './type';

export const code = 'E1004';

export const message: RuleMessage = {
  code,
  title: 'ECMA Version Check',
  type: 'markdown',
  category: 'bundle',
  description: `
#### Description

Detect if there is a low version of ECMA syntax in the js bundle file
`,
};

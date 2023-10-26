import { RuleErrorCodes } from '.';

/**
 * only defined the code which can be enumerated
 */
export enum RuleMessageCodeEnumerated {
  /**
   * others tools / frameworks errors, such as PIA
   */
  Extend = 'EXTEND',
  /**
   * errors show in the overlay at the client, such as Webpack compile errors in development
   */
  Overlay = 'OVERLAY',
}

export type RuleMessageCode =
  | keyof RuleErrorCodes // enumerated errors
  | `${RuleMessageCodeEnumerated}`
  | RuleMessageCodeEnumerated;

export enum RuleMessageCategory {
  Compile = 'compile',
  Bundle = 'bundle',
  EMO = 'emo',
}

export interface RuleMessage {
  code: RuleMessageCode;
  title: string;
  type: 'text' | 'markdown';
  category: `${RuleMessageCategory}` | RuleMessageCategory;
  description: string;
}

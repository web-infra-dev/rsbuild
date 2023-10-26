import { Parser as AcornParser, Options, Position } from 'acorn';
// @ts-ignore
import { importAssertions } from 'acorn-import-assertions';
import * as walk from 'acorn-walk';
import { asserts } from './asserts';
import * as utils from './utils';
import type { Node } from './types';

export type { Options as ParseOptions } from 'acorn';

export interface ParseError extends Error {
  loc?: Position;
  pos: number;
  raisedAt: number;
}

/**
 * parser for internal
 */
const acornParserInternal = AcornParser.extend(importAssertions);

/**
 * parser for developers
 */
let acornParserExport = AcornParser.extend(importAssertions);

export const parser = {
  /** AST iterator */
  walk,
  /**
   * Compile code
   * - Output root node is `Node.Program`
   */
  parse: (input: string, options: Options) => {
    return acornParserExport.parse(input, options) as Node.Program;
  },
  /**
   * Compile the next first expression
   * - The output root node is `Node.ExpressionStatement`
   */
  parseExpressionAt: (input: string, pos: number, options: Options) => {
    return acornParserExport.parseExpressionAt(
      input,
      pos,
      options,
    ) as Node.ExpressionStatement;
  },
  /**
   * add plugins for acorn
   */
  extend(...args: Parameters<typeof AcornParser.extend>) {
    acornParserExport = acornParserExport.extend(...args);
    return acornParserExport;
  },
  /** Set of assertions */
  asserts,
  utils,
  /**
   * @internal
   * parser for internal packages
   */
  internal: {
    parse: (input: string, options: Options) => {
      return acornParserInternal.parse(input, options) as Node.Program;
    },
    parseExpressionAt: (input: string, pos: number, options: Options) => {
      return acornParserInternal.parseExpressionAt(
        input,
        pos,
        options,
      ) as Node.ExpressionStatement;
    },
  },
};

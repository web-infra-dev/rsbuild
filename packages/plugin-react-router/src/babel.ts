import _generate from '@babel/generator';
import type { ParseResult, ParserOptions } from '@babel/parser';
import { parse as babelParse } from '@babel/parser';
/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { NodePath } from '@babel/traverse';
import _traverse from '@babel/traverse';
import type { Node } from '@babel/types';
import * as types from '@babel/types';

const parse: typeof babelParse = babelParse;
const t: typeof types = types;

// Add proper types for traverse and generate
const traverse: typeof _traverse.default = _traverse.default || _traverse;
const generate: typeof _generate.default = _generate.default || _generate;

export { traverse, generate, parse, t };
export type { Node, NodePath, ParseResult };
export type Babel = typeof types;

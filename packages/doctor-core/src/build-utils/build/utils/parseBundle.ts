import fs from 'fs';
import { find, mapValues } from 'lodash';
import bytes from 'bytes';

import { parser } from '@rsbuild/doctor-utils/ruleUtils';
import { extname } from 'path';

import { Plugin } from '@rsbuild/doctor-types';
import { ParseBundle } from '@/types';

/**
 * The following code is based on
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/44bd8d0f9aa3b098e271af220096ea70cc44bc9e/src/parseUtils.js#L10
 *
 *
 * MIT Licensed
 * Author th0r
 * Copyright JS Foundation and other contributors.
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/44bd8d0f9aa3b098e271af220096ea70cc44bc9e/LICENSE
 */
// TODO: optimize type
export const parseBundle: ParseBundle = (
  bundlePath: string,
  modulesData: Plugin.StatsModule[],
) => {
  if (bundlePath.indexOf('.worker.') > 0) {
    return {};
  }

  if (extname(bundlePath) !== '.js') {
    return {};
  }

  const content = fs.readFileSync(bundlePath, 'utf8');
  const ast = parser.internal.parse(content, {
    sourceType: 'script',
    ecmaVersion: 'latest',
  });

  const walkState = {
    locations: null,
    expressionStatementDepth: 0,
  };

  parser.walk.recursive(ast, walkState, {
    ExpressionStatement(
      node: any,
      state: { locations: any; expressionStatementDepth: number },
      c: (arg0: any, arg1: any) => void,
    ) {
      if (state.locations) return;

      state.expressionStatementDepth++;

      if (
        // Webpack 5 stores modules in the the top-level IIFE
        state.expressionStatementDepth === 1 &&
        // ast?.range?.includes(node) &&
        isIIFE(node)
      ) {
        const fn = getIIFECallExpression(node);

        if (
          // It should not contain neither arguments
          fn.arguments.length === 0 &&
          // ...nor parameters
          fn.callee.params.length === 0
        ) {
          // Modules are stored in the very first variable declaration as hash
          const firstVariableDeclaration = fn.callee.body.body.find(
            (node: { type: string }) => node.type === 'VariableDeclaration',
          );

          if (firstVariableDeclaration) {
            for (const declaration of firstVariableDeclaration.declarations) {
              if (declaration.init) {
                state.locations = getModulesLocations(declaration.init);

                if (state.locations) {
                  break;
                }
              }
            }
          }
        }
      }

      if (!state.locations) {
        c(node.expression, state);
      }

      state.expressionStatementDepth--;
    },

    AssignmentExpression(node: any, state: { locations: any }) {
      if (state.locations) return;

      // Modules are stored in exports.modules:
      // exports.modules = {};
      const { left, right } = node;

      if (
        left &&
        left.object &&
        left.object.name === 'exports' &&
        left.property &&
        left.property.name === 'modules' &&
        isModulesHash(right)
      ) {
        state.locations = getModulesLocations(right);
      }
    },

    CallExpression(
      node: any,
      state: { locations: any },
      c: (arg0: any, arg1: any) => any,
    ) {
      if (state.locations) return;

      const args = node.arguments;

      // Main chunk with webpack loader.
      // Modules are stored in first argument:
      // (function (...) {...})(<modules>)
      if (
        node.callee.type === 'FunctionExpression' &&
        !node.callee.id &&
        args.length === 1 &&
        isSimpleModulesList(args[0])
      ) {
        state.locations = getModulesLocations(args[0]);
        return;
      }

      // Async Webpack < v4 chunk without webpack loader.
      // webpackJsonp([<chunks>], <modules>, ...)
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.
      if (
        node.callee.type === 'Identifier' &&
        mayBeAsyncChunkArguments(args) &&
        isModulesList(args[1])
      ) {
        state.locations = getModulesLocations(args[1]);
        return;
      }

      // Async Webpack v4 chunk without webpack loader.
      // (window.webpackJsonp=window.webpackJsonp||[]).push([[<chunks>], <modules>, ...]);
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.
      if (isAsyncChunkPushExpression(node)) {
        state.locations = getModulesLocations(args[0].elements[1]);
        return;
      }

      // Webpack v4 WebWorkerChunkTemplatePlugin
      // globalObject.chunkCallbackName([<chunks>],<modules>, ...);
      // Both globalObject and chunkCallbackName can be changed through the config, so we can't check them.
      if (isAsyncWebWorkerChunkExpression(node)) {
        state.locations = getModulesLocations(args[1]);
        return;
      }

      // Walking into arguments because some of plugins (e.g. `DedupePlugin`) or some Webpack
      // features (e.g. `umd` library output) can wrap modules list into additional IIFE.
      args.forEach((arg: any) => c(arg, state));
    },
  });

  let modules;

  if (walkState.locations) {
    modules = mapValues(
      walkState.locations,
      (loc: { start: number; end: number }) =>
        content.slice(loc.start, loc.end),
    );
  } else {
    modules = {};
  }
  const modulesObj: Record<string, any> = {};
  // eslint-disable-next-line guard-for-in
  for (const module in modules) {
    if (!module) {
      return {};
    }

    const moduleContent = modules[module];
    const size = moduleContent && Buffer.byteLength(moduleContent);
    const _filterModules = find(modulesData, {
      id: Number(module),
    }) as Plugin.StatsModule;
    const identifier =
      _filterModules?.identifier ||
      find(modulesData, { id: module })?.identifier ||
      '';
    modulesObj[identifier] = {
      size,
      sizeConvert: bytes(size || 0),
      content: moduleContent,
    };
  }

  return {
    modules: modulesObj,
    src: content,
    runtimeSrc: getBundleRuntime(content, walkState.locations),
  };
};

/**
 * Returns bundle source except modules
 */
function getBundleRuntime(
  content: string,
  modulesLocations: Record<string, { start: number; end: number }> | null,
) {
  const sortedLocations = Object.values(modulesLocations || {}).sort(
    (a, b) => a.start - b.start,
  );

  let result = '';
  let lastIndex = 0;

  for (const { start, end } of sortedLocations) {
    result += content.slice(lastIndex, start);
    lastIndex = end;
  }

  return result + content.slice(lastIndex, content.length);
}

function isIIFE(node: {
  type: string;
  expression: { type: string; argument: { type: string } };
}) {
  return (
    node.type === 'ExpressionStatement' &&
    (node.expression.type === 'CallExpression' ||
      (node.expression.type === 'UnaryExpression' &&
        node.expression.argument.type === 'CallExpression'))
  );
}

function getIIFECallExpression(node: {
  expression: { type: string; argument: any };
}) {
  if (node.expression.type === 'UnaryExpression') {
    return node.expression.argument;
  }
  return node.expression;
}

function isModulesList(node: any) {
  return (
    isSimpleModulesList(node) ||
    // Modules are contained in expression `Array([minimum ID]).concat([<module>, <module>, ...])`
    isOptimizedModulesArray(node)
  );
}

function isSimpleModulesList(node: any) {
  return (
    // Modules are contained in hash. Keys are module ids.
    isModulesHash(node) ||
    // Modules are contained in array. Indexes are module ids.
    isModulesArray(node)
  );
}

function isModulesHash(node: { type: string; properties: any[] }) {
  return (
    node.type === 'ObjectExpression' &&
    node.properties
      .map((node: { value: any }) => node.value)
      .every(isModuleWrapper)
  );
}

function isModulesArray(node: { type: string; elements: any[] }) {
  return (
    node.type === 'ArrayExpression' &&
    node.elements.every(
      (elem: any) =>
        // Some of array items may be skipped because there is no module with such id
        !elem || isModuleWrapper(elem),
    )
  );
}

function isOptimizedModulesArray(node: {
  type: string;
  callee: {
    type: string;
    object: {
      type: string;
      callee: { type: string; name: string };
      arguments: string | any[];
    };
    property: { type: string; name: string };
  };
  arguments: string | any[];
}) {
  // Checking whether modules are contained in `Array(<minimum ID>).concat(...modules)` array:
  // https://github.com/webpack/webpack/blob/v1.14.0/lib/Template.js#L91
  // The `<minimum ID>` + array indexes are module ids
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    // Make sure the object called is `Array(<some number>)`
    node.callee.object.type === 'CallExpression' &&
    node.callee.object.callee.type === 'Identifier' &&
    node.callee.object.callee.name === 'Array' &&
    node.callee.object.arguments.length === 1 &&
    isNumericId(node.callee.object.arguments[0]) &&
    // Make sure the property X called for `Array(<some number>).X` is `concat`
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'concat' &&
    // Make sure exactly one array is passed in to `concat`
    node.arguments.length === 1 &&
    isModulesArray(node.arguments[0])
  );
}

function isModuleWrapper(node: {
  type: string;
  id: any;
  elements: string | any[];
}) {
  return (
    // It's an anonymous function expression that wraps module
    ((node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression') &&
      !node.id) ||
    // If `DedupePlugin` is used it can be an ID of duplicated module...
    isModuleId(node) ||
    // or an array of shape [<module_id>, ...args]
    (node.type === 'ArrayExpression' &&
      node.elements.length > 1 &&
      isModuleId(node.elements[0]))
  );
}

function isModuleId(node: any) {
  return (
    node.type === 'Literal' &&
    (isNumericId(node) || typeof node.value === 'string')
  );
}

function isNumericId(node: any) {
  return (
    node.type === 'Literal' && Number.isInteger(node.value) && node.value >= 0
  );
}

function isChunkIds(node: { type: string; elements: any[] }) {
  // Array of numeric or string ids. Chunk IDs are strings when NamedChunksPlugin is used
  return node.type === 'ArrayExpression' && node.elements.every(isModuleId);
}

function isAsyncChunkPushExpression(node: { callee: any; arguments: any }) {
  const { callee, arguments: args } = node;

  return (
    callee.type === 'MemberExpression' &&
    callee.property.name === 'push' &&
    callee.object.type === 'AssignmentExpression' &&
    args.length === 1 &&
    args[0].type === 'ArrayExpression' &&
    mayBeAsyncChunkArguments(args[0].elements) &&
    isModulesList(args[0].elements[1])
  );
}

function mayBeAsyncChunkArguments(args: string | any[]) {
  return args.length >= 2 && isChunkIds(args[0]);
}

function isAsyncWebWorkerChunkExpression(node: any) {
  const { callee, type, arguments: args } = node;

  return (
    type === 'CallExpression' &&
    callee.type === 'MemberExpression' &&
    args.length === 2 &&
    isChunkIds(args[0]) &&
    isModulesList(args[1])
  );
}

function getModulesLocations(node: {
  type: string;
  properties: any;
  callee: { object: { arguments: { value: any }[] } };
  arguments: { elements: any }[];
  elements: any;
}) {
  if (node.type === 'ObjectExpression') {
    // Modules hash
    const modulesNodes = node.properties;

    return modulesNodes.reduce(
      (
        result: { [x: string]: { start: any; end: any } },
        moduleNode: { key: { name: any; value: any }; value: any },
      ) => {
        const moduleId = moduleNode.key.name || moduleNode.key.value;

        result[moduleId] = getModuleLocation(moduleNode.value);
        return result;
      },
      {},
    );
  }

  const isOptimizedArray = node.type === 'CallExpression';

  if (node.type === 'ArrayExpression' || isOptimizedArray) {
    // Modules array or optimized array
    const minId = isOptimizedArray
      ? // Get the [minId] value from the Array() call first argument literal value
        node.callee.object.arguments[0].value
      : // `0` for simple array
        0;
    const modulesNodes = isOptimizedArray
      ? // The modules reside in the `concat()` function call arguments
        node.arguments[0].elements
      : node.elements;

    return modulesNodes.reduce(
      (
        result: { [x: string]: { start: number; end: number } },
        moduleNode: { start: number; end: number },
        i: number,
      ) => {
        if (moduleNode) {
          result[i + minId] = getModuleLocation(moduleNode);
        }
        return result;
      },
      {},
    );
  }

  return {};
}

function getModuleLocation(node: { start: any; end: any }) {
  return {
    start: node.start,
    end: node.end,
  };
}

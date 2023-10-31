import stripAnsi from 'strip-ansi';
// import { parse as stackParse } from '@web-doctor/stack-trace'; // TODO: add doctor stack-trace
import { Esbuild, Babel, Err, Linter } from '@rsbuild/doctor-types';
import { DevToolError } from './error';

function isEsbuildError(err: any): err is Esbuild.Error {
  return 'pluginName' in err && 'text' in err && 'location' in err;
}

function isBabelError(err: any): err is Babel.Error {
  return 'code' in err && 'reasonCode' in err;
}

function isDiagnosticError(err: any): err is Linter.Diagnostic {
  return 'severity' in err && 'title' in err;
}

function parseBabelErrorMessage(input: string) {
  const lines = stripAnsi(input).split('\n');
  const filePath = lines[0].replace(/^([^:]+):.*/, '$1');
  const message = lines[0].replace(/.*: (.*) \(\d+:\d+\)*/, '$1');
  const lineText =
    lines.find((line) => line.startsWith('> '))?.replace(/> \d+ \| /, '') ?? '';

  return {
    message,
    filePath,
    lineText,
  };
}

function clearMessage(str: string) {
  return stripAnsi(str).replace(/.*: (.*)\n\n[\s\S]*/g, '$1');
}

function clearStack(str: string) {
  return str
    .slice(str.indexOf('  at'))
    .replace(/\s*at(.*) \((.*)\)/g, '$1\n$2\n');
}

function transformEsbuildError(err: any, opt?: Err.DevToolErrorParams) {
  if (isEsbuildError(err)) {
    const errorCode = opt?.code ?? 'ESBUILD_ERROR';
    const speedyError =
      typeof err.detail === 'object'
        ? DevToolError.from(err.detail)
        : new DevToolError(errorCode, clearMessage(err.text), {
            ...opt,
            hint: err.location?.suggestion,
            codeFrame: {
              filePath: err.text.split(':')[0],
            },
          });

    if (err.location) {
      speedyError.setCodeFrame({
        filePath: err.location.file,
        lineText: err.location.lineText,
        length: err.location.length,
        start: {
          line: err.location.line,
          column: err.location.column + 1,
        },
      });
    }

    return speedyError;
  }
}

function transformBabelError(err: any, opt?: Err.DevToolErrorParams) {
  if (isBabelError(err)) {
    const errorCode = opt?.code ?? err.code ?? 'BABEL';
    const title = err.reasonCode;
    const errorParsed = parseBabelErrorMessage(err.message);
    const speedyError = new DevToolError(title, errorParsed.message, {
      ...opt,
      code: errorCode,
      stack: err.stack && clearStack(err.stack),
    });

    if (err.loc) {
      speedyError.setCodeFrame({
        ...errorParsed,
        start: {
          line: err.loc.line,
          column: err.loc.column + 1,
        },
      });
    }

    return speedyError;
  }
}

function transformNormalError(err: any, opt?: Err.DevToolErrorParams) {
  if (err instanceof Error) {
    // const stacks = stackParse(err); // TODO: add doctor stack-trace
    const stacks = [] as any[];
    const filePath = stacks?.[0]?.getFileName?.();
    return new DevToolError(err.name, clearMessage(err.message), {
      ...opt,
      codeFrame: filePath ? { filePath } : undefined,
      stack: err.stack && clearStack(err.stack),
    });
  }
}

function transformErrorLike(err: any, opt?: Err.DevToolErrorParams) {
  const isErrorLike = err && typeof err === 'object' && err.message;
  if (isErrorLike) {
    // const stacks = stackParse(err); // TODO: add doctor stack-trace
    const stacks = [] as any[];
    const filePath = stacks?.[0]?.getFileName?.();
    return new DevToolError(
      err.name || 'UNKNOWN_ERROR',
      clearMessage(err.message),
      {
        ...opt,
        codeFrame: filePath ? { filePath } : undefined,
        stack: err.stack && clearStack(err.stack),
      },
    );
  }
}

function transformDiagnostic(err: any, opt?: Err.DevToolErrorParams) {
  if (isDiagnosticError(err)) {
    return new DevToolError(err.title, err.message, {
      ...err,
      ...opt,
      hint: err.suggestions?.description,
      fixData: err.suggestions?.fixData,
      codeFrame: err.document
        ? {
            filePath: err.document.path,
            fileContent: err.document.content,
            start: err.document.range.start,
            end: err.document.range.end,
          }
        : undefined,
      level: Linter.Severity[err.severity] as Linter.SeverityString,
    });
  }
}

function defaultError(err: any, opt?: Err.DevToolErrorParams) {
  return new DevToolError('UNKNOWN_ERROR', JSON.stringify(err), opt);
}

export function transform(err: any, opt?: Err.DevToolErrorParams) {
  const transformers = [
    transformEsbuildError,
    transformBabelError,
    transformDiagnostic,
    transformNormalError,
    transformErrorLike,
  ];

  for (const fn of transformers) {
    const result = fn(err, opt);

    if (result) {
      return result;
    }
  }

  return defaultError(err, opt);
}

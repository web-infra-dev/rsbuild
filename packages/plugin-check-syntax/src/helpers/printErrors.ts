import { logger } from '@rsbuild/core';
import { color } from '@rsbuild/shared';
import type { ECMASyntaxError } from '../types';

type Error = {
  source: string;
  output?: string;
  reason: string;
  code: string;
};

export function printErrors(errors: ECMASyntaxError[]) {
  if (errors.length === 0) {
    logger.success('The syntax check success.');
    return;
  }

  const errs: Error[] = errors.map((error) => ({
    source: `${error.source.path}:${error.source.line}:${error.source.column}`,
    output: error.output
      ? `${error.output.path}:${error.output.line}:${error.output.column}`
      : undefined,
    reason: error.message,
    code: error.source.code,
  }));

  const longest = Math.max(...Object.keys(errs[0]).map((err) => err.length));
  logger.error(
    '[Syntax Checker] Find some syntax errors after production build:\n',
  );

  errs.forEach((err, index) => {
    console.log(color.bold(color.red(`  ERROR ${index + 1}`)));
    printMain(err, longest);
  });

  throw new Error(
    `[Syntax Checker] The current build fails due to an incompatible syntax, which can be fixed in the following ways:

  - If you want to downgrade the syntax, you can compile the corresponding module through the \`source.include\` config.
  - If you don't want to downgrade the syntax, you can adjust the project's browserslist to match the syntax.`,
  );
}

function printMain(error: Error, longest: number) {
  const fillWhiteSpace = (s: string, longest: number) => {
    if (s.length < longest) {
      const rightPadding = ' '.repeat(longest - s.length);
      return s + rightPadding;
    }
    return s;
  };
  Object.entries(error).forEach(([key, content]) => {
    if (!content) {
      return;
    }
    const title = color.magenta(`${fillWhiteSpace(`${key}:`, longest + 1)}`);
    console.info(`  ${title}  ${content}`);
  });
  console.info('');
}

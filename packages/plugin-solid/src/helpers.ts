const DEFAULT_SOLID_SCRIPT_REGEX = /\.(?:jsx|tsx)$/i;

// Native transforms infer the parser from a standard JSX/TSX extension.
export const getTransformFilename = (filename: string): string =>
  DEFAULT_SOLID_SCRIPT_REGEX.test(filename)
    ? filename
    : `${filename}${/\.[mc]?tsx$/i.test(filename) ? '.tsx' : '.jsx'}`;

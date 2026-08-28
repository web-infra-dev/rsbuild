export const DEFAULT_SOLID_SCRIPT_REGEX: RegExp = /\.(?:jsx|tsx)$/i;

export const isDefaultSolidScript = (filename: string): boolean =>
  DEFAULT_SOLID_SCRIPT_REGEX.test(filename);

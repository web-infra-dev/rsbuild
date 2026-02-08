import { styleText } from 'node:util';

type ColorFn = (text: string | number) => string;
type ColorMap = Record<
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'gray'
  | 'dim'
  | 'bold'
  | 'underline',
  ColorFn
>;

const createStyler =
  (style: Parameters<typeof styleText>[0]): ColorFn =>
  (text) =>
    styleText(style, String(text));

export const color: ColorMap = {
  red: createStyler('red'),
  yellow: createStyler('yellow'),
  green: createStyler('green'),
  blue: createStyler('blue'),
  magenta: createStyler('magenta'),
  cyan: createStyler('cyan'),
  gray: createStyler('gray'),
  dim: createStyler('dim'),
  bold: createStyler('bold'),
  underline: createStyler('underline'),
};

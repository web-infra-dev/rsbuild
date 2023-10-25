import type { chalk } from '@rsbuild/shared/chalk';

type Color = (typeof chalk)['ForegroundColor'];

export type Props = {
  total: number;
  current: number;
  color: Color;
  bgColor: Color;
  char: string;
  width: number;
  buildIcon: string;
  errorIcon: string;
  errorInfo: string;
  message: string;
  done: boolean;
  messageWidth: number;
  spaceWidth: number;
  messageColor: Color;
  id: string;
  maxIdLen: number;
  hasErrors: boolean;
};

export type BusOption = {
  state: Props[];
};

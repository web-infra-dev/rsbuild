import type color from 'picocolors';

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

export type Props = {
  total: number;
  current: number;
  color: Colors;
  bgColor: Colors;
  char: string;
  width: number;
  buildIcon: string;
  errorIcon: string;
  errorInfo: string;
  message: string;
  done: boolean;
  messageWidth: number;
  spaceWidth: number;
  messageColor: Colors;
  id: string;
  maxIdLen: number;
  hasErrors: boolean;
};

export type BusOption = {
  state: Props[];
};

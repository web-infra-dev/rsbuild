import color from 'picocolors';

export { color };

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

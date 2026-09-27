export const isCI = (): boolean =>
  Boolean(process.env.CI) && process.env.CI !== 'false';

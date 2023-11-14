/* eslint-disable prettier/prettier */
// prettier-ignore
export enum CheckVersion {
  null       = 0,
  prerelease = 0x1,
  prepatch   = 0x10,
  patch      = 0x100,
  preminor   = 0x1000,
  minor      = 0x10000,
  premajor   = 0x100000,
  major      = 0x1000000,
}

// prettier-ignore
export enum CheckVersionMap {
  null       = 0,
  prerelease = 0x0000001,
  prepatch   = 0x0000011,
  patch      = 0x0000111,
  preminor   = 0x0001111,
  minor      = 0x0011111,
  premajor   = 0x0111111,
  major      = 0x1111111,
}

export interface Config {
  checkVersion: keyof typeof CheckVersion;
  ignore: string[];
}

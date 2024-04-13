import fs from 'node:fs';
import { join } from 'node:path';
import {
  getSharedPkgCompiledPath,
  type SharedCompiledPkgNames,
} from '@rsbuild/shared';

export const getCompiledPath = (packageName: string) => {
  const providerCompilerPath = join(__dirname, '../../compiled', packageName);
  if (fs.existsSync(providerCompilerPath)) {
    return providerCompilerPath;
  }
  return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
};

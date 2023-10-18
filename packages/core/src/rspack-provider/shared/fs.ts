import { join } from 'path';
import {
  getSharedPkgCompiledPath,
  SharedCompiledPkgNames,
} from '@rsbuild/shared';
import { fs } from '@modern-js/utils';

export const getCompiledPath = (packageName: string) => {
  const providerCompilerPath = join(__dirname, '../../compiled', packageName);
  if (fs.existsSync(providerCompilerPath)) {
    return providerCompilerPath;
  } else {
    return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
  }
};

import path, { isAbsolute, join } from 'path';
import fse from '../compiled/fs-extra';
import { MODULE_PATH_REGEX } from './constants';
import { removeLeadingSlash } from './utils';
import { promises, constants, statSync } from 'fs';
import type {
  HtmlConfig,
  OutputConfig,
  DistPathConfig,
  FilenameConfig,
  NormalizedOutputConfig,
} from './types';

export { fse };

export function getAbsoluteDistPath(
  cwd: string,
  outputConfig: OutputConfig | NormalizedOutputConfig,
) {
  const root = getDistPath(outputConfig, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

export const getDistPath = (
  outputConfig: OutputConfig | NormalizedOutputConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = outputConfig;
  const ret = distPath?.[type];
  if (typeof ret !== 'string') {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

export async function isFileExists(file: string) {
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const isFileSync = (filePath: string) => {
  try {
    return statSync(filePath, { throwIfNoEntry: false })?.isFile();
  } catch (_) {
    return false;
  }
};

/**
 * Find first already exists file.
 * @param files - Absolute file paths with extension.
 * @returns The file path if exists, or false if no file exists.
 */
export const findExists = (files: string[]): string | false => {
  for (const file of files) {
    if (isFileSync(file)) {
      return file;
    }
  }
  return false;
};

export function getPackageNameFromModulePath(modulePath: string) {
  const handleModuleContext = modulePath?.match(MODULE_PATH_REGEX);

  if (!handleModuleContext) {
    return false;
  }

  const [, , scope, name] = handleModuleContext;
  const packageName = ['npm', (scope ?? '').replace('@', ''), name]
    .filter(Boolean)
    .join('.');

  return packageName;
}

export function getHTMLPathByEntry(
  entryName: string,
  config: {
    output: NormalizedOutputConfig;
    html: HtmlConfig;
  },
) {
  const htmlPath = getDistPath(config.output, 'html');
  const filename =
    config.html.outputStructure === 'flat'
      ? `${entryName}.html`
      : `${entryName}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

export const getFilename = (
  output: NormalizedOutputConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
) => {
  const { filename } = output;
  const useHash = !output.disableFilenameHash;
  const hash = useHash ? '.[contenthash:8]' : '';

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${isProd ? hash : ''}.js`;
    case 'css':
      return filename.css ?? `[name]${isProd ? hash : ''}.css`;
    case 'svg':
      return filename.svg ?? `[name]${hash}.svg`;
    case 'font':
      return filename.font ?? `[name]${hash}[ext]`;
    case 'image':
      return filename.image ?? `[name]${hash}[ext]`;
    case 'media':
      return filename.media ?? `[name]${hash}[ext]`;
    default:
      throw new Error(`unknown key ${type} in "output.filename"`);
  }
};

export async function findUp({
  filename,
  cwd = process.cwd(),
}: {
  filename: string;
  cwd?: string;
}) {
  const { root } = path.parse(cwd);

  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);

    try {
      const stats = await promises.stat(filePath);
      if (stats?.isFile()) {
        return filePath;
      }
    } catch {}

    dir = path.dirname(dir);
  }
}

export function findUpSync({
  filename,
  cwd = process.cwd(),
}: {
  filename: string;
  cwd?: string;
}) {
  const { root } = path.parse(cwd);

  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);

    try {
      if (isFileSync(filePath)) {
        return filePath;
      }
    } catch {}

    dir = path.dirname(dir);
  }
}

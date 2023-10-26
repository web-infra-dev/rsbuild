import { isAbsolute } from 'path';

export function isUrl(uri: string) {
  return /^https?:\/\//.test(uri);
}

export function isFilePath(uri: string) {
  return isAbsolute(uri);
}

export function isRemoteUrl(uri: unknown) {
  if (typeof uri === 'string') {
    if (isUrl(uri) || isFilePath(uri)) {
      return true;
    }
  }

  return false;
}

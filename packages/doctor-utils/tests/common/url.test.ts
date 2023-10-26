import { describe, it, expect } from 'vitest';
import { Url } from '../../src/common';

describe('test src/common/url.ts', () => {
  it('isUrl', () => {
    expect(Url.isUrl('asf')).toBeFalsy();
    expect(Url.isUrl('[123]')).toBeFalsy();
    expect(Url.isUrl('file://sdfa')).toBeFalsy();
    expect(Url.isUrl('chrome://settings/')).toBeFalsy();
    expect(Url.isUrl('http')).toBeFalsy();
    expect(Url.isUrl('https')).toBeFalsy();
    expect(Url.isUrl('http://ssaf')).toBeTruthy();
    expect(Url.isUrl('https://sdsfa')).toBeTruthy();
  });

  it('isFilePath', () => {
    expect(Url.isFilePath('asf')).toBeFalsy();
    expect(Url.isFilePath('[123]')).toBeFalsy();
    expect(Url.isFilePath('file://sdfa')).toBeFalsy();
    expect(Url.isFilePath('chrome://settings/')).toBeFalsy();
    expect(Url.isFilePath('http')).toBeFalsy();
    expect(Url.isFilePath('https')).toBeFalsy();
    expect(Url.isFilePath('http://ssaf')).toBeFalsy();
    expect(Url.isFilePath('https://sdsfa')).toBeFalsy();
    expect(Url.isFilePath('/Users/a')).toBeTruthy();
  });

  it('isRemoteUrl', () => {
    expect(Url.isRemoteUrl('asf')).toBeFalsy();
    expect(Url.isRemoteUrl('[123]')).toBeFalsy();
    expect(Url.isRemoteUrl('file://sdfa')).toBeFalsy();
    expect(Url.isRemoteUrl('chrome://settings/')).toBeFalsy();
    expect(Url.isRemoteUrl('http')).toBeFalsy();
    expect(Url.isRemoteUrl('https')).toBeFalsy();
    expect(Url.isRemoteUrl('http://ssaf')).toBeTruthy();
    expect(Url.isRemoteUrl('https://sdsfa')).toBeTruthy();
    expect(Url.isRemoteUrl('/Users/a')).toBeTruthy();
  });
});

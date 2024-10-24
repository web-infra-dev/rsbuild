import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import fse from 'fs-extra';

export const expectPackageJson = (
  pkgJson: Record<string, any>,
  name: string,
) => {
  expect(pkgJson.name).toBe(name);
  expect(pkgJson.scripts.dev).toBe('rsbuild dev --open');
  expect(pkgJson.scripts.build).toBe('rsbuild build');
  expect(pkgJson.devDependencies['@rsbuild/core']).toBeTruthy();
};

export const createAndValidate = (
  cwd: string,
  template: string,
  {
    name = `test-temp-${template}`,
    tools = [],
    clean = true,
  }: {
    name?: string;
    tools?: string[];
    clean?: boolean;
  } = {},
) => {
  const dir = path.join(cwd, name);
  fse.removeSync(dir);

  let command = `npx create-rsbuild -d ${name} -t ${template}`;
  if (tools.length) {
    const toolsCmd = tools.map((tool) => `--tools ${tool}`).join(' ');
    command += ` ${toolsCmd}`;
  }

  execSync(command, { cwd });

  const pkgJson = fse.readJSONSync(path.join(dir, 'package.json'));
  expectPackageJson(pkgJson, path.basename(name));

  if (template.endsWith('-ts')) {
    expect(pkgJson.devDependencies.typescript).toBeTruthy();
    expect(existsSync(path.join(dir, 'tsconfig.json'))).toBeTruthy();
  }

  const cleanFn = () => fse.removeSync(dir);
  if (clean) {
    cleanFn();
  }

  return { dir, pkgJson, clean: cleanFn };
};

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  cancel,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  text,
} from '@clack/prompts';
import deepmerge from 'deepmerge';
import minimist from 'minimist';
import { logger } from 'rslog';

function cancelAndExit() {
  cancel('Operation cancelled.');
  process.exit(0);
}

function checkCancel<T>(value: unknown) {
  if (isCancel(value)) {
    cancelAndExit();
  }
  return value as T;
}

/**
 * 1. Input: 'foo'
 *    Output: folder `<cwd>/foo`, `package.json#name` -> `foo`
 *
 * 2. Input: 'foo/bar'
 *    Output: folder -> `<cwd>/foo/bar` folder, `package.json#name` -> `bar`
 *
 * 3. Input: '@scope/foo'
 *    Output: folder -> `<cwd>/@scope/bar` folder, `package.json#name` -> `@scope/foo`
 *
 * 4. Input: './foo/bar'
 *    Output: folder -> `<cwd>/foo/bar` folder, `package.json#name` -> `bar`
 *
 * 5. Input: '/root/path/to/foo'
 *    Output: folder -> `'/root/path/to/foo'` folder, `package.json#name` -> `foo`
 */
function formatProjectName(input: string) {
  const formatted = input.trim().replace(/\/+$/g, '');
  return {
    packageName: formatted.startsWith('@')
      ? formatted
      : path.basename(formatted),
    targetDir: formatted,
  };
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

function isEmptyDir(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

type Argv = {
  help?: boolean;
  dir?: string;
  template?: string;
  override?: boolean;
  tools?: string | string[];
};

function logHelpMessage() {
  logger.log(`
   Usage: create-rsbuild [options]

   Options:
   
     -h, --help       display help for command
     -d, --dir        create project in specified directory
     -t, --template   specify the template to use
     --tools          select additional tools (biome, eslint, prettier)
     --override       override files in target directory
   
   Templates:
   
     react            react-ts
     vue3             vue3-ts
     vue2             vue2-ts
     lit              lit-ts
     preact           preact-ts
     svelte           svelte-ts
     solid            solid-ts
     vanilla          vanilla-ts
`);
}

async function getTemplate({ template }: Argv) {
  if (template) {
    const pair = template.split('-');
    const language = pair[1] ?? 'js';
    return {
      framework: pair[0],
      language,
    };
  }

  const framework = checkCancel<string>(
    await select({
      message: 'Select framework',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue3', label: 'Vue 3' },
        { value: 'vue2', label: 'Vue 2' },
        { value: 'lit', label: 'Lit' },
        { value: 'preact', label: 'Preact' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'solid', label: 'Solid' },
        { value: 'vanilla', label: 'Vanilla' },
      ],
    }),
  );

  const language = checkCancel<string>(
    await select({
      message: 'Select language',
      options: [
        { value: 'ts', label: 'TypeScript' },
        { value: 'js', label: 'JavaScript' },
      ],
    }),
  );

  return {
    framework,
    language,
  };
}

async function getTools({ tools }: Argv) {
  if (tools) {
    return Array.isArray(tools) ? tools : [tools];
  }

  return checkCancel<string[]>(
    await multiselect({
      message: 'Select additional tools (press enter to continue)',
      options: [
        { value: 'biome', label: 'Add Biome for code linting and formatting' },
        { value: 'eslint', label: 'Add ESLint for code linting' },
        { value: 'prettier', label: 'Add Prettier for code formatting' },
      ],
      required: false,
    }),
  );
}

export async function main() {
  const argv = minimist<Argv>(process.argv.slice(2), {
    alias: { h: 'help', d: 'dir', t: 'template' },
  });

  console.log('');
  logger.greet('◆  Create Rsbuild Project');

  if (argv.help) {
    logHelpMessage();
    return;
  }

  const cwd = process.cwd();
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
  const packageRoot = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const { version } = require(packageJsonPath);

  const projectName =
    argv.dir ??
    checkCancel<string>(
      await text({
        message: 'Project name or path',
        placeholder: 'rsbuild-project',
        defaultValue: 'rsbuild-project',
        validate(value) {
          if (value.length === 0) {
            return 'Project name is required';
          }
        },
      }),
    );

  const { targetDir, packageName } = formatProjectName(projectName);
  const distFolder = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(cwd, targetDir);

  if (!argv.override && fs.existsSync(distFolder) && !isEmptyDir(distFolder)) {
    const option = checkCancel<string>(
      await select({
        message: `"${targetDir}" is not empty, please choose:`,
        options: [
          { value: 'yes', label: 'Continue and override files' },
          { value: 'no', label: 'Cancel operation' },
        ],
      }),
    );

    if (option === 'no') {
      cancelAndExit();
    }
  }

  const { framework, language } = await getTemplate(argv);
  const tools = await getTools(argv);

  const srcFolder = path.join(packageRoot, `template-${framework}-${language}`);
  const commonFolder = path.join(packageRoot, 'template-common');

  copyFolder(commonFolder, distFolder, version);
  copyFolder(srcFolder, distFolder, version, packageName);

  for (const tool of tools) {
    const toolFolder = path.join(packageRoot, `template-${tool}`);

    if (tool === 'eslint') {
      let subFolder = path.join(toolFolder, `${framework}-${language}`);

      if (!fs.existsSync(subFolder)) {
        subFolder = path.join(toolFolder, `common-${language}`);
      }

      copyFolder(subFolder, distFolder, version);
    } else {
      copyFolder(toolFolder, distFolder, version);
    }
  }

  const nextSteps = [
    `cd ${targetDir}`,
    `${pkgManager} i`,
    `${pkgManager} run dev`,
  ];

  note(nextSteps.join('\n'), 'Next steps');

  outro('Done.');
}

function sortObjectKeys(obj: Record<string, unknown>) {
  const sortedKeys = Object.keys(obj).sort();

  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }

  return sortedObj;
}

function mergePackageJson(targetPackage: string, extraPackage: string) {
  if (!fs.existsSync(targetPackage)) {
    return;
  }

  const targetJson = JSON.parse(fs.readFileSync(targetPackage, 'utf-8'));
  const extraJson = JSON.parse(fs.readFileSync(extraPackage, 'utf-8'));
  const mergedJson: Record<string, unknown> = deepmerge(targetJson, extraJson);

  mergedJson.name = targetJson.name || extraJson.name;

  for (const key of ['scripts', 'dependencies', 'devDependencies']) {
    if (!(key in mergedJson)) {
      continue;
    }
    mergedJson[key] = sortObjectKeys(
      mergedJson[key] as Record<string, unknown>,
    );
  }

  fs.writeFileSync(targetPackage, `${JSON.stringify(mergedJson, null, 2)}\n`);
}

function copyFolder(src: string, dist: string, version: string, name?: string) {
  const renameFiles: Record<string, string> = {
    gitignore: '.gitignore',
  };

  // Skip local files
  const skipFiles = ['node_modules', 'dist'];

  fs.mkdirSync(dist, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    if (skipFiles.includes(file)) {
      continue;
    }

    const srcFile = path.resolve(src, file);
    const distFile = renameFiles[file]
      ? path.resolve(dist, renameFiles[file])
      : path.resolve(dist, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      copyFolder(srcFile, distFile, version);
    } else if (file === 'package.json') {
      const targetPackage = path.resolve(dist, 'package.json');
      if (fs.existsSync(targetPackage)) {
        mergePackageJson(targetPackage, srcFile);
      } else {
        fs.copyFileSync(srcFile, distFile);
        updatePackageJson(distFile, version, name);
      }
    } else {
      fs.copyFileSync(srcFile, distFile);
    }
  }
}

const isStableVersion = (version: string) => {
  return ['alpha', 'beta', 'rc', 'canary', 'nightly'].every(
    (tag) => !version.includes(tag),
  );
};

const updatePackageJson = (
  pkgJsonPath: string,
  version: string,
  name?: string,
) => {
  let content = fs.readFileSync(pkgJsonPath, 'utf-8');

  // Lock the version if it is not stable
  const targetVersion = isStableVersion(version) ? `^${version}` : version;

  content = content.replace(/workspace:\*/g, targetVersion);

  const pkg = JSON.parse(content);

  if (name && name !== '.') {
    pkg.name = name;
  }

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
};

main();

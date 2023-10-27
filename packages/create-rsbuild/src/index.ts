#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { logger } from 'rslog';
import { text, select, isCancel, cancel, note, outro } from '@clack/prompts';

function checkCancel(value: unknown) {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '');
}

async function main() {
  console.log('');
  logger.greet('◆  Create Rsbuild Project');

  const cwd = process.cwd();
  const packageRoot = path.resolve(__dirname, '..');

  let targetDir = (await text({
    message: 'Input target folder',
    placeholder: 'my-project',
    validate(value) {
      if (value.length === 0) {
        return `Target folder is required`;
      }
      if (fs.existsSync(path.join(cwd, value))) {
        return `"${value}" is not empty, please input another folder`;
      }
    },
  })) as string;

  checkCancel(targetDir);

  targetDir = formatTargetDir(targetDir);

  const framework = (await select({
    message: 'Select framework',
    options: [
      { value: 'react', label: 'React' },
      { value: 'vue3', label: 'Vue 3' },
      { value: 'vue2', label: 'Vue 2' },
    ],
  })) as string;

  checkCancel(framework);

  const language = (await select({
    message: 'Select language',
    options: [
      { value: 'ts', label: 'TypeScript' },
      { value: 'js', label: 'JavaScript' },
    ],
  })) as string;

  checkCancel(language);

  const srcFolder = path.join(packageRoot, `template-${framework}-${language}`);
  const commonFolder = path.join(packageRoot, `template-common`);
  const distFolder = path.join(cwd, targetDir);

  copyFolder(commonFolder, distFolder);
  copyFolder(srcFolder, distFolder);

  const nextSteps = [`cd ${targetDir}`, 'npm i', 'npm dev'];

  note(nextSteps.join('\n'), 'Next steps');

  outro('Done.');
}

function copyFolder(src: string, dist: string) {
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
      copyFolder(srcFile, distFile);
    } else {
      fs.copyFileSync(srcFile, distFile);
    }
  }
}

main();

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Argv,
  checkCancel,
  copyFolder,
  create,
  type ESLintTemplateName,
  select,
} from 'create-rstack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frameworkAlias: Record<string, string> = {
  vue: 'vue3',
  'solid-js': 'solid',
};

async function getTemplateName({ template }: Argv) {
  if (typeof template === 'string') {
    const pair = template.split('-');
    const language = pair[1] ?? 'js';
    const framework = pair[0];

    return `${frameworkAlias[framework] ?? framework}-${language}`;
  }

  const framework = checkCancel<string>(
    await select({
      message: 'Select framework',
      options: [
        { value: 'vanilla', label: 'Vanilla' },
        { value: 'react', label: 'React 19' },
        { value: 'react18', label: 'React 18' },
        { value: 'vue3', label: 'Vue 3' },
        { value: 'vue2', label: 'Vue 2' },
        { value: 'lit', label: 'Lit' },
        { value: 'preact', label: 'Preact' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'solid', label: 'Solid' },
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

  return `${framework}-${language}`;
}

function mapESLintTemplate(templateName: string): ESLintTemplateName {
  switch (templateName) {
    case 'react-js':
    case 'react-ts':
    case 'svelte-js':
    case 'svelte-ts':
      return templateName;
    case 'vue2-js':
    case 'vue3-js':
      return 'vue-js';
    case 'vue2-ts':
    case 'vue3-ts':
      return 'vue-ts';
    case 'react18-js':
      return 'react-js';
    case 'react18-ts':
      return 'react-ts';
  }
  const language = templateName.split('-')[1];
  return `vanilla-${language}` as ESLintTemplateName;
}

function mapRstestTemplate(templateName: string): string {
  switch (templateName) {
    case 'react-js':
    case 'react18-js':
      return 'react-js';
    case 'react-ts':
    case 'react18-ts':
      return 'react-ts';
    case 'vue3-js':
      return 'vue-js';
    case 'vue3-ts':
      return 'vue-ts';
    default:
      return '';
  }
}

create({
  root: path.resolve(__dirname, '..'),
  name: 'rsbuild',
  templates: [
    'vanilla-js',
    'vanilla-ts',
    'react-js',
    'react-ts',
    'react18-js',
    'react18-ts',
    'vue3-js',
    'vue3-ts',
    'vue2-js',
    'vue2-ts',
    'svelte-js',
    'svelte-ts',
    'solid-js',
    'solid-ts',
  ],
  getTemplateName,
  mapESLintTemplate,
  extraTools: [
    {
      value: 'storybook',
      label: 'Add Storybook for component development',
      command: 'npm create storybook@latest -- --skip-install --features docs',
    },
    {
      value: 'rstest',
      label: 'Add Rstest for unit testing',
      action: ({ templateName, distFolder, addAgentsMdSearchDirs }) => {
        const rstestTemplate = mapRstestTemplate(templateName);

        if (!rstestTemplate) {
          console.warn(
            `no rstest template for ${templateName}, you can add it manually later.\n https://rstest.rs/guide/start/quick-start`,
          );
          return;
        }
        const toolFolder = path.join(__dirname, '..', 'template-rstest');
        const subFolder = path.join(toolFolder, rstestTemplate);

        copyFolder({
          from: subFolder,
          to: distFolder,
          isMergePackageJson: true,
        });

        addAgentsMdSearchDirs(toolFolder);
      },
    },
  ],
});

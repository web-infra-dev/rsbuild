import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Argv,
  type ESLintTemplateName,
  checkCancel,
  create,
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
      return 'react-js';
  }
  const language = templateName.split('-')[1];
  return `vanilla-${language}` as ESLintTemplateName;
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
});

import fs from 'node:fs';
import path from 'node:path';
import {
  type Argv,
  checkCancel,
  copyFolder,
  create,
  type ESLintTemplateName,
  select,
} from 'create-rstack';

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
    default:
      return `vanilla-${templateName.split('-')[1]}` as ESLintTemplateName;
  }
}

function mapRstestTemplate(templateName: string): string {
  switch (templateName) {
    case 'react-js':
      return 'react-js';
    case 'react-ts':
      return 'react-ts';
    case 'vue3-js':
      return 'vue-js';
    case 'vue3-ts':
      return 'vue-ts';
    default:
      return `vanilla-${templateName.split('-')[1]}`;
  }
}

const root = path.join(import.meta.dirname, '..');

create({
  root,
  name: 'rsbuild',
  templates: [
    'vanilla-js',
    'vanilla-ts',
    'react-js',
    'react-ts',
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
      value: 'rstest',
      label: 'Rstest - testing',
      order: 'pre',
      action: ({ templateName, distFolder, addAgentsMdSearchDirs }) => {
        const rstestTemplate = mapRstestTemplate(templateName);
        const toolFolder = path.join(root, 'template-rstest');
        const subFolder = path.join(toolFolder, rstestTemplate);

        copyFolder({
          from: subFolder,
          to: distFolder,
          isMergePackageJson: true,
        });
        addAgentsMdSearchDirs(toolFolder);
      },
    },
    {
      value: 'react-compiler',
      label: 'React Compiler - optimization',
      order: 'pre',
      when: (template) => template === 'react-js' || template === 'react-ts',
      action: ({ templateName, distFolder }) => {
        const toolFolder = path.join(root, 'template-react-compiler');
        copyFolder({
          from: path.join(toolFolder, templateName),
          to: distFolder,
          isMergePackageJson: true,
        });
      },
    },
    {
      value: 'tailwindcss',
      label: 'Tailwind CSS - styling',
      action: async ({ distFolder }) => {
        const from = path.join(root, 'template-tailwindcss');
        copyFolder({
          from: from,
          to: distFolder,
          isMergePackageJson: true,
        });

        // Insert tailwindcss import to main CSS file
        const mainCssFile = ['index.css', 'App.css'];
        for (const cssFile of mainCssFile) {
          const filePath = path.join(distFolder, 'src', cssFile);
          if (fs.existsSync(filePath)) {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            await fs.promises.writeFile(
              filePath,
              `@import 'tailwindcss';\n\n${content}`,
            );
            break;
          }
        }
      },
    },
    {
      value: 'storybook',
      label: 'Storybook - component development',
      command: 'npm create storybook@latest -- --skip-install --features docs',
    },
  ],
});

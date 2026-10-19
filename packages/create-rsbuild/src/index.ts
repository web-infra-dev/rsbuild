import fs from 'node:fs';
import path from 'node:path';
import {
  type Argv,
  checkCancel,
  copyFolder,
  create,
  type ESLintTemplateName,
  type RslintTemplateName,
  select,
  type TemplateCreateContext,
  xSync,
} from '@rstackjs/create-toolkit';
import {
  addPluginsToRsbuildConfig,
  enableReactCompilerInRsbuildConfig,
  tailwindcssPlugin,
} from './rsbuildConfig.js';

const frameworkAlias: Record<string, string> = {
  vue3: 'vue',
  'solid-js': 'solid',
};

let isNonInteractive = false;

async function getTemplateName({ dir, template }: Argv) {
  isNonInteractive = typeof dir === 'string' && typeof template === 'string';

  if (typeof template === 'string') {
    if (
      template === 'tanstack-start-react' ||
      template === 'tanstack-start-solid'
    ) {
      return template;
    }
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
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'lit', label: 'Lit' },
        { value: 'preact', label: 'Preact' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'solid', label: 'Solid' },
        { value: 'octane', label: 'Octane' },
        { value: 'lynx', label: 'Lynx' },
      ],
    }),
  );

  if (framework === 'solid') {
    return checkCancel<string>(
      await select({
        message: 'Select template',
        options: [
          { value: 'solid-ts', label: 'Solid 1 (TypeScript)' },
          { value: 'solid-js', label: 'Solid 1 (JavaScript)' },
          { value: 'solid2-ts', label: 'Solid 2 (TypeScript)' },
          { value: 'solid2-js', label: 'Solid 2 (JavaScript)' },
          { value: 'tanstack-start-solid', label: 'TanStack Start' },
        ],
      }),
    );
  }

  const variant = checkCancel<string>(
    await select({
      message: 'Select template',
      options: [
        { value: 'ts', label: 'Basic (TypeScript)' },
        { value: 'js', label: 'Basic (JavaScript)' },
        ...(framework === 'react'
          ? [{ value: 'tanstack-start', label: 'TanStack Start' }]
          : []),
      ],
    }),
  );

  if (variant === 'tanstack-start') {
    return `tanstack-start-${framework}`;
  }

  return `${framework}-${variant}`;
}

function createTanStackProject(
  framework: 'React' | 'Solid',
  { distFolder, packageName, gitEnabled, override }: TemplateCreateContext,
) {
  const args = [
    '@tanstack/cli@latest',
    'create',
    '--framework',
    framework,
    '--build-tool',
    'rsbuild',
    '--target-dir',
    distFolder,
    packageName,
  ];
  if (isNonInteractive) {
    // Skip npx's install confirmation and TanStack's setup prompts.
    args.unshift('--yes');
    args.push('--yes');
  }
  if (!gitEnabled) {
    args.push('--no-git');
  }
  if (override) {
    args.push('--force');
  }
  const result = xSync('npx', args, {
    nodePath: false,
    nodeOptions: { stdio: 'inherit' },
  });
  process.exitCode = result.exitCode ?? 1;
}

function createLynxProject(
  language: 'ts' | 'js',
  { distFolder, packageName, gitEnabled, override }: TemplateCreateContext,
) {
  const args = [
    '@lynx-js/create-lynx@latest',
    distFolder,
    '--template',
    `rsbuild-react-${language}`,
    '--package-name',
    packageName,
  ];
  if (isNonInteractive) {
    args.unshift('--yes');
  }
  if (!gitEnabled) {
    args.push('--no-git');
  }
  if (override) {
    args.push('--override');
  }
  const result = xSync('npx', args, {
    nodePath: false,
    nodeOptions: { stdio: 'inherit' },
  });
  process.exitCode = result.exitCode ?? 1;
}

function mapESLintTemplate(
  templateName: string,
  { distFolder }: { distFolder: string },
): ESLintTemplateName {
  const packageJsonPath = path.join(distFolder, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
    devDependencies: Record<string, string>;
  };

  // typescript-eslint still requires TypeScript 6's JavaScript API.
  if (/^[~^]?7\./.test(packageJson.devDependencies.typescript ?? '')) {
    packageJson.devDependencies.typescript = '^6.0.3';
    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
    );
  }

  switch (templateName) {
    case 'react-js':
    case 'react-ts':
    case 'svelte-js':
    case 'svelte-ts':
      return templateName;
    case 'vue-js':
    case 'vue3-js':
      return 'vue-js';
    case 'vue-ts':
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
    case 'vue-js':
    case 'vue3-js':
      return 'vue-js';
    case 'vue-ts':
    case 'vue3-ts':
      return 'vue-ts';
    default:
      return `vanilla-${templateName.split('-')[1]}`;
  }
}

function mapRslintTemplate(templateName: string): RslintTemplateName {
  switch (templateName) {
    case 'react-js':
    case 'react-ts':
      return templateName;
    default:
      return `vanilla-${templateName.split('-')[1]}` as RslintTemplateName;
  }
}

const root = path.join(import.meta.dirname, '..');

await create({
  root,
  name: 'rsbuild',
  templates: [
    'vanilla-js',
    'vanilla-ts',
    'react-js',
    'react-ts',
    {
      name: 'tanstack-start-react',
      create: (context) => createTanStackProject('React', context),
    },
    'vue-js',
    'vue-ts',
    'lit-js',
    'lit-ts',
    'preact-js',
    'preact-ts',
    'svelte-js',
    'svelte-ts',
    'solid-js',
    'solid-ts',
    {
      name: 'tanstack-start-solid',
      create: (context) => createTanStackProject('Solid', context),
    },
    'solid2-js',
    'solid2-ts',
    'octane-js',
    'octane-ts',
    {
      name: 'lynx-js',
      create: (context) => createLynxProject('js', context),
    },
    {
      name: 'lynx-ts',
      create: (context) => createLynxProject('ts', context),
    },
  ],
  getTemplateName,
  mapESLintTemplate,
  mapRslintTemplate,
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
      when: ({ templateName }) =>
        ['react-js', 'react-ts'].includes(templateName),
      action: async ({ distFolder }) => {
        await enableReactCompilerInRsbuildConfig(distFolder);
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

        await addPluginsToRsbuildConfig(distFolder, [tailwindcssPlugin]);
      },
    },
    {
      value: 'storybook',
      label: 'Storybook - component development',
      command: 'npm create storybook@latest -- --skip-install --features docs',
    },
  ],
  extraSkills: [
    {
      value: 'rsbuild-best-practices',
      label: 'Rsbuild best practices',
      source: 'rstackjs/agent-skills',
    },
    {
      value: 'rstest-best-practices',
      label: 'Rstest best practices',
      source: 'rstackjs/agent-skills',
      when: ({ tools }) => tools.includes('rstest'),
    },
    {
      value: 'vercel-react-best-practices',
      label: 'React best practices',
      source: 'vercel-labs/agent-skills',
      when: ({ templateName }) => templateName.startsWith('react-'),
    },
  ],
});

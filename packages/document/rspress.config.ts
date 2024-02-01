import path from 'node:path';
import { defineConfig } from 'rspress/config';
import { rsbuildPluginOverview } from './src/rsbuildPluginOverview';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'en',
  base: '/',
  title: 'Rsbuild',
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rsbuild/favicon-128x128.png',
  logo: {
    light:
      'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rsbuild/navbar-logo-10164.png',
    dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rsbuild/navbar-logo-dark-10164.png',
  },
  markdown: {
    checkDeadLinks: true,
  },
  route: {
    cleanUrls: true,
    // exclude document fragments from routes
    exclude: ['**/zh/shared/**', '**/en/shared/**'],
  },
  themeConfig: {
    footer: {
      message: 'Copyright © 2024 ByteDance.',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rsbuild',
      },
      {
        icon: 'twitter',
        mode: 'link',
        content: 'https://twitter.com/rspack_dev',
      },
      {
        icon: 'discord',
        mode: 'link',
        content: 'https://discord.gg/XsaKEEk4mW',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
        title: 'Rsbuild',
        description: 'The Rspack-based build tool for the web',
      },
      {
        lang: 'zh',
        label: '简体中文',
        title: 'Rsbuild',
        outlineTitle: '目录',
        prevPageText: '上一页',
        nextPageText: '下一页',
        description: '基于 Rspack 的 Web 构建工具',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/rsbuild/tree/main/packages/document/docs',
      text: 'Edit this page on GitHub',
    },
  },
  builderConfig: {
    plugins: [rsbuildPluginOverview],
    source: {
      alias: {
        '@components': path.join(__dirname, 'src/components'),
        '@en': path.join(__dirname, 'docs/en'),
        '@zh': path.join(__dirname, 'docs/zh'),
      },
    },
    dev: {
      startUrl: 'http://localhost:<port>/',
    },
    html: {
      tags: [
        // Configure Google Analytics
        {
          tag: 'script',
          attrs: {
            async: true,
            src: 'https://www.googletagmanager.com/gtag/js?id=G-L6BZ6TKW4R',
          },
        },
        {
          tag: 'script',
          children: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-L6BZ6TKW4R');`,
        },
      ],
    },
  },
});

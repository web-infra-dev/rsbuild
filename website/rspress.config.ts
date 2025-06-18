import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginAlgolia } from '@rspress/plugin-algolia';
import { pluginClientRedirects } from '@rspress/plugin-client-redirects';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginRss } from '@rspress/plugin-rss';
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import { defineConfig } from 'rspress/config';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';
import pluginSitemap from 'rspress-plugin-sitemap';
import { rsbuildPluginOverview } from './theme/rsbuildPluginOverview';

const siteUrl = 'https://rsbuild.rs';
const description = 'The Rspack-based build tool';

export default defineConfig({
  plugins: [
    pluginAlgolia(),
    pluginLlms(),
    pluginSitemap({
      domain: siteUrl,
    }),
    pluginFontOpenSans(),
    pluginRss({
      siteUrl,
      feed: [
        {
          id: 'releases-rss',
          test: '/community/releases/v',
          title: 'Rsbuild Releases',
          language: 'en',
          output: {
            type: 'rss',
            filename: 'releases-rss.xml',
          },
        },
        {
          id: 'releases-atom',
          test: '/community/releases/v',
          title: 'Rsbuild Releases',
          language: 'en',
          output: {
            type: 'atom',
          },
        },
        {
          id: 'releases-rss-zh',
          test: '/zh/community/releases/v',
          title: 'Rsbuild Releases',
          language: 'zh-CN',
          output: {
            type: 'rss',
            filename: 'releases-rss-zh.xml',
          },
        },
        {
          id: 'releases-atom-zh',
          test: '/zh/community/releases/v',
          title: 'Rsbuild Releases',
          language: 'zh-CN',
          output: {
            type: 'atom',
          },
        },
      ],
    }),
    pluginClientRedirects({
      redirects: [
        {
          from: '/config/source/alias',
          to: '/config/resolve/alias',
        },
        {
          from: '/config/source/alias-strategy',
          to: '/config/resolve/alias-strategy',
        },
        {
          from: '/plugins/list/plugin-assets-retry',
          to: 'https://github.com/rspack-contrib/rsbuild-plugin-assets-retry',
        },
        {
          from: '/guide/basic/css-usage',
          to: '/guide/styling/css-usage',
        },
        {
          from: '/guide/basic/css-modules',
          to: '/guide/styling/css-modules',
        },
        {
          from: '/guide/basic/tailwindcss',
          to: '/guide/styling/tailwindcss',
        },
        {
          from: '/guide/basic/tailwindcss-v3',
          to: '/guide/styling/tailwindcss-v3',
        },
        {
          from: '/guide/basic/unocss',
          to: '/guide/styling/unocss',
        },
        {
          from: '/guide/basic/configure-rspack',
          to: '/guide/configuration/rspack',
        },
        {
          from: '/guide/basic/configure-rsbuild',
          to: '/guide/configuration/rsbuild',
        },
        {
          from: '/guide/basic/configure-swc',
          to: '/guide/configuration/swc',
        },
      ],
    }),
  ],
  lang: 'en',
  title: 'Rsbuild',
  description:
    'Rsbuild is a high-performance build tool powered by Rspack. It provides out-of-the-box setup for enjoyable development experience.',
  icon: 'https://assets.rspack.rs/rsbuild/favicon-128x128.png',
  logo: {
    light: 'https://assets.rspack.rs/rsbuild/navbar-logo-light.png',
    dark: 'https://assets.rspack.rs/rsbuild/navbar-logo-dark.png',
  },
  markdown: {
    checkDeadLinks: true,
    shiki: {
      langs: ['styl', 'html', 'toml'],
      langAlias: {
        ejs: 'js',
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
      ],
    },
  },
  route: {
    cleanUrls: true,
    // exclude document fragments from routes
    exclude: ['**/zh/shared/**', '**/en/shared/**'],
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rsbuild',
      },
      {
        icon: 'x',
        mode: 'link',
        content: 'https://twitter.com/rspack_dev',
      },
      {
        icon: 'discord',
        mode: 'link',
        content: 'https://discord.gg/XsaKEEk4mW',
      },
      {
        icon: 'bluesky',
        mode: 'link',
        content: 'https://bsky.app/profile/rspack.rs',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
        description,
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rsbuild/tree/main/website/docs',
          text: '📝 Edit this page on GitHub',
        },
      },
      {
        lang: 'zh',
        label: '简体中文',
        outlineTitle: '目录',
        prevPageText: '上一页',
        nextPageText: '下一页',
        description: '由 Rspack 驱动的构建工具',
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rsbuild/tree/main/website/docs',
          text: '📝 在 GitHub 上编辑此页',
        },
      },
    ],
  },
  head: [
    ({ routePath }) => {
      const getOgImage = () => {
        if (routePath.endsWith('releases/v1-0')) {
          return 'assets/rsbuild-og-image-v1-0.png';
        }
        return 'rsbuild-og-image.png';
      };
      return `<meta property="og:image" content="https://assets.rspack.rs/rsbuild/${getOgImage()}">`;
    },
  ],
  builderConfig: {
    plugins: [
      rsbuildPluginOverview,
      pluginSass(),
      pluginGoogleAnalytics({ id: 'G-L6BZ6TKW4R' }),
      pluginOpenGraph({
        title: 'Rsbuild',
        type: 'website',
        url: siteUrl,
        description,
        twitter: {
          site: '@rspack_dev',
          card: 'summary_large_image',
        },
      }),
    ],
    server: {
      open: true,
    },
    html: {
      tags: [
        // for baidu SEO verification
        {
          tag: 'meta',
          attrs: {
            name: 'baidu-site-verification',
            content: 'codeva-mYbzBtlg6o',
          },
        },
      ],
      appIcon: {
        name: 'Rsbuild',
        icons: [
          {
            src: 'https://assets.rspack.rs/rsbuild/rsbuild-logo-192x192.png',
            size: 192,
          },
          {
            src: 'https://assets.rspack.rs/rsbuild/rsbuild-logo-512x512.png',
            size: 512,
          },
        ],
      },
    },
  },
});

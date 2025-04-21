import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginClientRedirects } from '@rspress/plugin-client-redirects';
import { pluginRss } from '@rspress/plugin-rss';
import { pluginShiki } from '@rspress/plugin-shiki';
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';
import pluginSitemap from 'rspress-plugin-sitemap';
import { defineConfig } from 'rspress/config';
import { rsbuildPluginOverview } from './theme/rsbuildPluginOverview';

const siteUrl = 'https://rsbuild.dev';

export default defineConfig({
  plugins: [
    pluginShiki({
      langs: ['styl', 'html', 'toml'],
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
      ],
    }),
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
  icon: 'https://assets.rspack.dev/rsbuild/favicon-128x128.png',
  logo: {
    light: 'https://assets.rspack.dev/rsbuild/navbar-logo-light.png',
    dark: 'https://assets.rspack.dev/rsbuild/navbar-logo-dark.png',
  },
  markdown: {
    checkDeadLinks: true,
  },
  route: {
    cleanUrls: true,
    // exclude document fragments from routes
    exclude: ['**/zh/shared/**', '**/en/shared/**', './theme', './src'],
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
        content: 'https://bsky.app/profile/rspack.dev',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
        description: 'The Rspack-based build tool for the web',
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
      return `<meta property="og:image" content="https://assets.rspack.dev/rsbuild/${getOgImage()}">`;
    },
  ],
  builderConfig: {
    dev: {
      lazyCompilation: true,
    },
    plugins: [
      rsbuildPluginOverview,
      pluginSass(),
      pluginGoogleAnalytics({ id: 'G-L6BZ6TKW4R' }),
      pluginOpenGraph({
        title: 'Rsbuild',
        type: 'website',
        url: siteUrl,
        description: 'The Rspack-based build tool',
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
            src: 'https://assets.rspack.dev/rsbuild/rsbuild-logo-192x192.png',
            size: 192,
          },
          {
            src: 'https://assets.rspack.dev/rsbuild/rsbuild-logo-512x512.png',
            size: 512,
          },
        ],
      },
    },
  },
});

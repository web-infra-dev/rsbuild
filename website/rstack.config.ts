import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginAlgolia } from '@rspress/plugin-algolia';
import { pluginRss } from '@rspress/plugin-rss';
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';
import { define } from 'rstack';
import { rsbuildPluginOverview } from './theme/rsbuildPluginOverview.ts';

const siteUrl = 'https://rsbuild.rs';
const description = 'The Rspack-based build tool';

define.doc({
  siteOrigin: siteUrl,
  plugins: [
    pluginAlgolia(),
    pluginFontOpenSans(),
    pluginRss({
      siteUrl,
      feed: [
        {
          id: 'releases-rss',
          test: '/blog/v',
          title: 'Rsbuild Blogs',
          language: 'en',
          output: {
            type: 'rss',
            filename: 'releases-rss.xml',
          },
        },
        {
          id: 'releases-atom',
          test: '/blog/v',
          title: 'Rsbuild Blogs',
          language: 'en',
          output: {
            type: 'atom',
          },
        },
        {
          id: 'releases-rss-zh',
          test: '/zh/blog/v',
          title: 'Rsbuild Blogs',
          language: 'zh-CN',
          output: {
            type: 'rss',
            filename: 'releases-rss-zh.xml',
          },
        },
        {
          id: 'releases-atom-zh',
          test: '/zh/blog/v',
          title: 'Rsbuild Blogs',
          language: 'zh-CN',
          output: {
            type: 'atom',
          },
        },
      ],
    }),
  ],
  lang: 'en',
  title: 'Rsbuild',
  description: 'Rsbuild is a high-performance build tool powered by Rspack.',
  icon: 'https://assets.rspack.rs/rsbuild/favicon-128x128.png',
  logo: {
    light: 'https://assets.rspack.rs/rsbuild/navbar-logo-light.png',
    dark: 'https://assets.rspack.rs/rsbuild/navbar-logo-dark.png',
  },
  markdown: {
    link: {
      checkAnchors: true,
    },
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
    llmsUI: {
      placement: 'outline',
    },
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
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/rsbuild/tree/main/website/docs',
    },
    locales: [
      {
        lang: 'en',
        label: 'English',
        description,
      },
      {
        lang: 'zh',
        label: '简体中文',
        description: '由 Rspack 驱动的构建工具',
      },
    ],
  },
  head: [
    ({ routePath }) => {
      const getOgImage = () => {
        if (routePath.includes('blog/v1-') || routePath.includes('blog/v2-')) {
          const version = routePath.split('blog/v')[1];
          return `assets/rsbuild-og-image-v${version}.png`;
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
        url: siteUrl,
        description,
        twitter: {
          site: '@rspack_dev',
          card: 'summary_large_image',
        },
      }),
    ],
    tools: {
      rspack: {
        experiments: {
          nativeWatcher: true,
        },
      },
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

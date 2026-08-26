import { Link, renderInlineMarkdown } from '@rspress/core/theme';
import {
  BlogList as BaseBlogList,
  type BlogListItem,
} from '@rstackjs/doc-ui/blog-list';
import { BlogBackground } from '@rstackjs/doc-ui/blog-background';
import type { BlogAvatarAuthor } from '@rstackjs/doc-ui/blog-avatar';
import { useLang, usePages } from '@rspress/core/runtime';

const DEFAULT_AUTHOR: BlogAvatarAuthor = {
  name: 'Rstack Team',
  avatar: 'https://assets.rspack.rs/rspack/rspack-logo-with-background.png',
  github: 'https://github.com/web-infra-dev',
  x: 'https://x.com/rspack_dev',
};

type BlogFrontmatter = {
  description?: string;
  date?: string;
  authors?: BlogAvatarAuthor[];
};

const EXTERNAL_BLOG_PAGES: Record<string, BlogListItem[]> = {
  en: [
    {
      title: 'Announcing Rsbuild 2.2',
      description:
        'Rsbuild 2.2 adds source text imports, enables chunk splitting by default for Node.js builds, supports Solid v2 and Octane, and adds dynamic ports, and custom restart handling.',
      date: '2026-08-26',
      href: 'https://rspack.rs/blog/announcing-2-2#rsbuild',
      authors: [
        {
          name: 'Jiahan Chen',
          avatar: 'https://github.com/chenjiahan.png',
        },
      ],
    },
  ],
  zh: [
    {
      title: 'Rsbuild 2.2 发布',
      description:
        'Rsbuild 2.2 新增源文本导入，优化 Node.js 构建拆包，支持 Solid v2 和 Octane，并带来动态端口和自定义重启流程。',
      date: '2026-08-26',
      href: 'https://rspack.rs/zh/blog/announcing-2-2#rsbuild',
      authors: [
        {
          name: 'Jiahan Chen',
          avatar: 'https://github.com/chenjiahan.png',
        },
      ],
    },
  ],
};

const getDateValue = (date?: BlogListItem['date']): number => {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const withDefaultAuthor = (page: BlogListItem): BlogListItem => ({
  ...page,
  authors: page.authors?.length ? page.authors : [DEFAULT_AUTHOR],
});

export const useBlogPages = (): BlogListItem[] => {
  const { pages } = usePages();
  const lang = useLang();

  const localBlogPages = pages
    .filter((page) => page.lang === lang)
    .filter(
      (page) =>
        page.routePath.includes('/blog/') && !page.routePath.endsWith('/blog/'),
    )
    .map((page) => {
      const frontmatter = (page.frontmatter ?? {}) as BlogFrontmatter;

      return withDefaultAuthor({
        title: page.title,
        description: frontmatter.description,
        date: frontmatter.date,
        href: page.routePath,
        authors: frontmatter.authors,
      });
    });

  const externalBlogPages = (EXTERNAL_BLOG_PAGES[lang] ?? []).map((page) =>
    withDefaultAuthor(page),
  );

  return [...localBlogPages, ...externalBlogPages].sort(
    (a, b) => getDateValue(b.date) - getDateValue(a.date),
  );
};

export function BlogList() {
  const lang = useLang();
  const posts = useBlogPages();

  return (
    <>
      <BaseBlogList
        posts={posts}
        lang={lang}
        LinkComp={Link}
        renderInlineMarkdown={renderInlineMarkdown}
      />
      <BlogBackground />
    </>
  );
}

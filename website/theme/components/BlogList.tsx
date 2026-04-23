import { Link, renderInlineMarkdown } from '@rspress/core/theme';
import { BlogList as BaseBlogList } from '@rstack-dev/doc-ui/blog-list';
import { BlogBackground } from '@rstack-dev/doc-ui/blog-background';
import { useLang } from '@rspress/core/runtime';
import { useBlogPages } from '../hooks/useBlogPages';

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

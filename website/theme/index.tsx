import { Layout as BaseLayout } from '@rspress/core/theme-original';
import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { HomeLayout } from './pages';
import './index.scss';
import { NoSSR, useLang, usePage } from '@rspress/core/runtime';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';

// Enable announcement when we have something to announce
const ANNOUNCEMENT_URL = '/blog/v2-0';

const Layout = () => {
  const { page } = usePage();
  const lang = useLang();

  return (
    <BaseLayout
      beforeNavTitle={<NavIcon />}
      beforeNav={
        ANNOUNCEMENT_URL ? (
          <NoSSR>
            <Announcement
              href={
                lang === 'en' ? ANNOUNCEMENT_URL : `/${lang}${ANNOUNCEMENT_URL}`
              }
              message={
                lang === 'en'
                  ? 'Rsbuild 2.0 has been released!'
                  : 'Rsbuild 2.0 正式发布！'
              }
              localStorageKey="rsbuild-v2-announcement-closed"
              display={page.pageType === 'home'}
            />
          </NoSSR>
        ) : null
      }
    />
  );
};
const Search = () => {
  const lang = useLang();
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: 'LBYJGZQY5U', // cspell:disable-line
        apiKey: 'ecb541ceb2b67d7f23e12e6fb4772c0f', // cspell:disable-line
        indexName: 'rsbuild',
        searchParameters: {
          facetFilters: [`lang:${lang}`],
        },
      }}
      locales={ZH_LOCALES}
    />
  );
};

export { Layout, HomeLayout, Search };

export * from '@rspress/core/theme-original';

import {
  Layout as BaseLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
} from '@rspress/core/theme-original';
import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { HomeLayout } from './pages';
import './index.scss';
import { NoSSR, useLang, usePageData } from '@rspress/core/runtime';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';

// Enable announcement when we have something to announce
const ANNOUNCEMENT_URL = '';

export function getCustomMDXComponent() {
  const { h1: H1, ...mdxComponents } = basicGetCustomMDXComponent();

  const MyH1 = ({ ...props }) => {
    return (
      <>
        <H1 {...props} />
        <LlmsContainer>
          <LlmsCopyButton />
          <LlmsViewOptions />
        </LlmsContainer>
      </>
    );
  };
  return {
    ...mdxComponents,
    h1: MyH1,
  };
}

const Layout = () => {
  const { page } = usePageData();
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
                  ? 'Rsbuild 1.0 has been released!'
                  : 'Rsbuild 1.0 正式发布！'
              }
              localStorageKey="rsbuild-announcement-closed"
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

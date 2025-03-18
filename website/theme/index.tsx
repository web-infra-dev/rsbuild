import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { Layout as BaseLayout } from 'rspress/theme';
import { HomeLayout } from './pages';
import './index.scss';
import { NoSSR, useLang, usePageData } from 'rspress/runtime';

// Enable announcement when we have something to announce
const ANNOUNCEMENT_URL = '';

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

export { Layout, HomeLayout };

export * from 'rspress/theme';

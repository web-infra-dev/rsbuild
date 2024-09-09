import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import Theme from 'rspress/theme';
import { HomeLayout } from './pages';
import './index.scss';
import { NoSSR, useLang, usePageData } from 'rspress/runtime';

const ANNOUNCEMENT_URL = '/community/releases/v1-0';

const Layout = () => {
  const { page } = usePageData();
  const lang = useLang();

  return (
    <Theme.Layout
      beforeNavTitle={<NavIcon />}
      beforeNav={
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
      }
    />
  );
};

export default {
  ...Theme,
  Layout,
  HomeLayout,
};

export * from 'rspress/theme';

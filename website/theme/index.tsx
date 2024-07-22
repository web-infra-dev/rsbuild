import { NavIcon } from 'rsfamily-doc-ui/nav-icon';
import Theme from 'rspress/theme';
import { HomeLayout } from './pages';
import './index.scss';

const Layout = () => <Theme.Layout beforeNavTitle={<NavIcon />} />;

export default {
  ...Theme,
  Layout,
  HomeLayout,
};

export * from 'rspress/theme';

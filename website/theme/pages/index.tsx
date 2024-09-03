import { BackgroundImage } from '@rstack-dev/doc-ui/background-image';
import { usePageData } from 'rspress/runtime';
import { Benchmark } from '../components/Benchmark';
import { Hero } from '../components/Hero';
import { ToolStack } from '../components/ToolStack';
import { WhyRsbuild } from '../components/WhyRsbuild';

const CopyRight = () => {
  const { siteData } = usePageData();
  const { message } = siteData.themeConfig.footer || {};

  if (!message) {
    return null;
  }

  return (
    <footer className="bottom-0 mt-12 py-8 px-6 sm:p-8 w-full border-t border-solid border-divider-light">
      <div className="m-auto w-full text-center">
        <div className="font-medium text-sm text-text-2">{message}</div>
      </div>
    </footer>
  );
};

export function HomeLayout() {
  return (
    <div style={{ position: 'relative' }}>
      <BackgroundImage />
      <Hero />
      <WhyRsbuild />
      <Benchmark />
      <ToolStack />
      <CopyRight />
    </div>
  );
}

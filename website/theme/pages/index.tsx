import { HomeBackground as BasicHomeBackground } from '@rspress/core/theme';
import { BackgroundImage } from '@rstack-dev/doc-ui/background-image';
import { Benchmark } from '../components/Benchmark';
import { CopyRight } from '../components/Copyright';
import { Features } from '../components/Features';
import { Hero } from '../components/Hero';
import { HomeFooter } from '../components/HomeFooter';
import { ToolStack } from '../components/ToolStack';

function HomeBackground() {
  return (
    <>
      {/* For transparent nav at top */}
      <BasicHomeBackground style={{ background: 'none' }} />
      <BackgroundImage />
    </>
  );
}

export function HomeLayout() {
  return (
    <div style={{ position: 'relative' }}>
      <HomeBackground />
      <Hero />
      <Features />
      <Benchmark />
      <ToolStack />
      <HomeFooter />
      <CopyRight />
    </div>
  );
}

import { BackgroundImage } from '@rstack-dev/doc-ui/background-image';
import { Benchmark } from '../components/Benchmark';
import { CopyRight } from '../components/Copyright';
import { Hero } from '../components/Hero';
import { ToolStack } from '../components/ToolStack';
import { WhyRsbuild } from '../components/WhyRsbuild';

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

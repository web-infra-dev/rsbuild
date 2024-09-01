import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { Benchmark } from '../components/Benchmark';
import { ToolStack } from '../components/ToolStack';

export function HomeLayout() {
  return (
    <BasicHomeLayout
      afterFeatures={
        <>
          <Benchmark />
          <ToolStack />
        </>
      }
    />
  );
}

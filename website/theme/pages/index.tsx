import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { Benchmark } from '../components/Benchmark';

export function HomeLayout() {
  return (
    <BasicHomeLayout
      afterFeatures={
        <>
          <Benchmark />
        </>
      }
    />
  );
}

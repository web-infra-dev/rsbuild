import { useI18n } from '@rspress/core/runtime';
import {
  Benchmark as BaseBenchmark,
  type BenchmarkData,
} from '@rstack-dev/doc-ui/benchmark';
import {
  containerStyle,
  descStyle,
  innerContainerStyle,
  titleAndDescStyle,
  titleStyle,
} from '@rstack-dev/doc-ui/section-style';

// Benchmark data for different cases
// Unit: second
// From: https://github.com/rspack-contrib/build-tools-performance
const BENCHMARK_DATA: BenchmarkData = {
  rspack: {
    label: 'Rsbuild',
    metrics: [
      {
        time: 0.41,
        desc: 'dev',
      },
      {
        time: 0.28,
        desc: 'build',
      },
      {
        time: 0.08,
        desc: 'hmr',
      },
    ],
  },
  viteSwc: {
    label: 'Vite + SWC',
    metrics: [
      {
        time: 1.29,
        desc: 'dev',
      },
      {
        time: 1.39,
        desc: 'build',
      },
      {
        time: 0.05,
        desc: 'hmr',
      },
    ],
  },
  webpackSwc: {
    label: 'webpack + SWC',
    metrics: [
      {
        time: 2.26,
        desc: 'dev',
      },
      {
        time: 2.01,
        desc: 'build',
      },
      {
        time: 0.2,
        desc: 'hmr',
      },
    ],
  },
  webpackBabel: {
    label: 'webpack + Babel',
    metrics: [
      {
        time: 5.02,
        desc: 'dev',
      },
      {
        time: 6.52,
        desc: 'build',
      },
      {
        time: 0.2,
        desc: 'hmr',
      },
    ],
  },
};

export function BenchmarkGraph() {
  return <BaseBenchmark data={BENCHMARK_DATA} />;
}

export function Benchmark() {
  const t = useI18n<typeof import('i18n')>();
  return (
    <section className={containerStyle}>
      <div className={innerContainerStyle}>
        <div className={titleAndDescStyle}>
          <h1 className={titleStyle}>{t('benchmarkTitle')}</h1>
          <p className={descStyle}>{t('benchmarkDesc')}</p>
        </div>
        <BenchmarkGraph />
      </div>
    </section>
  );
}

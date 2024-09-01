import {
  Benchmark as BaseBenchmark,
  type BenchmarkData,
} from '@rstack-dev/doc-ui/benchmark';
import { useI18n } from 'rspress/runtime';
import styles from './Benchmark.module.scss';

// Benchmark data for different cases
// Unit: second
// From: https://github.com/rspack-contrib/performance-compare
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

export function BenchmarkGraph(props: { short?: boolean }) {
  return props.short ? (
    <div className={styles.short}>
      <BaseBenchmark data={BENCHMARK_DATA} />
    </div>
  ) : (
    <BaseBenchmark data={BENCHMARK_DATA} />
  );
}

export function Benchmark() {
  const t = useI18n<typeof import('i18n')>();
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('benchmarkTitle')}</h2>
        <p className={styles.desc}>{t('benchmarkDesc')}</p>
      </div>
      <BenchmarkGraph />
    </div>
  );
}

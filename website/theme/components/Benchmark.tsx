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
        time: 0.49,
        desc: 'dev',
      },
      {
        time: 0.36,
        desc: 'build',
      },
      {
        time: 0.09,
        desc: 'hmr',
      },
    ],
  },
  viteSwc: {
    label: 'Vite + SWC',
    metrics: [
      {
        time: 1.58,
        desc: 'dev',
      },
      {
        time: 1.37,
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
        time: 2.4,
        desc: 'dev',
      },
      {
        time: 2.12,
        desc: 'build',
      },
      {
        time: 0.22,
        desc: 'hmr',
      },
    ],
  },
  webpackBabel: {
    label: 'webpack + Babel',
    metrics: [
      {
        time: 5.13,
        desc: 'dev',
      },
      {
        time: 6.47,
        desc: 'build',
      },
      {
        time: 0.22,
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
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('benchmarkTitle')}</h2>
        <p className={styles.desc}>{t('benchmarkDesc')}</p>
      </div>
      <BenchmarkGraph />
    </div>
  );
}

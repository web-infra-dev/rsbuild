import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism, totalmem } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const cli = path.join(
  path.dirname(require.resolve('rstack/package.json')),
  'bin/rs.js',
);
const pools = ['forks', 'vmForks', 'vmThreads'];
const rounds = 6;
const results = [];

console.log(
  'POOL_BENCH_ENV',
  JSON.stringify({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: availableParallelism(),
    memoryGB: totalmem() / 1024 ** 3,
    nodeOptions: process.env.NODE_OPTIONS,
    rounds,
  }),
);

function run(pool, round) {
  const start = performance.now();
  const child = spawnSync(
    process.execPath,
    [cli, 'test', '--pool', pool, '--reporters', 'md'],
    {
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  const wallMs = Math.round(performance.now() - start);
  const output = `${child.stdout ?? ''}\n${child.stderr ?? ''}`;
  const match = output.match(/```json\s*([\s\S]*?)```/);
  const summary = match ? JSON.parse(match[1]) : undefined;
  if (
    child.status !== 0 ||
    summary?.status !== 'pass' ||
    summary.counts.testFiles !== 64 ||
    summary.counts.passedTests !== 499 ||
    summary.counts.tests !== 499
  ) {
    console.error(output);
    throw new Error(
      `${pool} round ${round} failed validation: ${child.error ?? child.status}`,
    );
  }
  const result = { pool, round, wallMs, ...summary };
  console.log('POOL_BENCH_SAMPLE', JSON.stringify(result));
  if (round > 0) results.push(result);
}

for (const pool of pools) run(pool, 0);
for (let round = 1; round <= rounds; round++) {
  for (let position = 0; position < pools.length; position++) {
    run(pools[(round - 1 + position) % pools.length], round);
  }
}

const stats = (values) => ({
  mean: values.reduce((sum, value) => sum + value, 0) / values.length,
  min: Math.min(...values),
  max: Math.max(...values),
});
const averages = pools.map((pool) => {
  const samples = results.filter((result) => result.pool === pool);
  return {
    pool,
    samples: samples.length,
    wallMs: stats(samples.map((sample) => sample.wallMs)),
    totalMs: stats(samples.map((sample) => sample.durationMs.total)),
    buildMs: stats(samples.map((sample) => sample.durationMs.build)),
    testsMs: stats(samples.map((sample) => sample.durationMs.tests)),
  };
});
console.log('POOL_BENCH_AVERAGES', JSON.stringify(averages));

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## Worker pool comparison',
    '',
    `${process.platform} ${process.arch}, ${process.version}, ${availableParallelism()} CPUs. Each pool: 1 warmup + ${rounds} measured runs; rotating order. Every run passed 64 files / 499 tests. Default worker counts and memory limits.`,
    '',
    '| Pool | Mean wall time | Mean Rstest duration | Rstest min–max |',
    '| --- | ---: | ---: | ---: |',
    ...averages.map(
      (result) =>
        `| ${result.pool} | ${result.wallMs.mean.toFixed(0)} ms | ${result.totalMs.mean.toFixed(0)} ms | ${result.totalMs.min}–${result.totalMs.max} ms |`,
    ),
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

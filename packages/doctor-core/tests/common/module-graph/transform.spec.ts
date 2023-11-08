import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { ModuleGraph } from '@/build-utils/common';
import { Chunks } from '@/build-utils/build';
import { compileByWebpack5, removeAbsModulePath } from '../utils';

const resolveFixture = (...paths: string[]) => {
  return path.resolve(__dirname, '../../fixtures', ...paths);
};

describe('module graph transform from stats', () => {
  it('normal module in multi concatenation module', async () => {
    const fixtureName = 'normal-module-in-multi-concatenation';
    const stats = await compileByWebpack5(
      {
        entry1: resolveFixture(fixtureName, 'entry1'),
        entry2: resolveFixture(fixtureName, 'entry2'),
      },
      {
        output: {
          path: resolveFixture(fixtureName, 'dist'),
          filename: '[name].js',
          chunkFilename: '[name].js',
        },
      },
    );

    const chunkGraph = Chunks.chunkTransform(new Map(), stats);

    const graph = ModuleGraph.getModuleGraphByStats(
      stats,
      resolveFixture(fixtureName),
      chunkGraph,
    );

    removeAbsModulePath(graph, resolveFixture(fixtureName));

    expect(graph.getModules().length).toEqual(5);
    expect(graph.getDependencies().length).toEqual(2);
    const graphData = graph.toData();
    expect(graphData.modules[0].webpackId.length).toBeTruthy();

    graphData.modules.forEach((mod) => (mod.webpackId = ''));
    expect(graphData).toMatchSnapshot();
  });

  it('module type === from origin', async () => {
    const json = fs.readFileSync(
      path.join(__dirname, '../../fixtures/assets/webpack-stats.json'),
      {
        encoding: 'utf-8',
      },
    );
    const statsData = JSON.parse(json);
    const chunkGraph = Chunks.chunkTransform(new Map(), statsData);
    const moduleGraph = ModuleGraph.getModuleGraphByStats(
      statsData,
      '.',
      chunkGraph,
    );
    expect(moduleGraph.toData()).toMatchSnapshot();
  });
});

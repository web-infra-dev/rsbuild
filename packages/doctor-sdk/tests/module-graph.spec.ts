import path from 'path';
import { expect, describe, it } from 'vitest';
import type { SDK } from '@rsbuild/doctor-types';
import { Module, ModuleGraph, PackageGraph } from '../src/graph';

const resolveFixture = (...paths: string[]) => {
  return path.resolve(__dirname, 'fixture', ...paths);
};

function arrayEq<T>(actual: T[], expected: T[]) {
  expect(actual.length).toBe(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
}

describe('module graph', () => {
  it('from space data', async () => {
    expect(ModuleGraph.fromData({}).toData()).toStrictEqual({
      modules: [],
      dependencies: [],
      exports: [],
      moduleGraphModules: [],
      sideEffects: [],
      variables: [],
    });
  });

  it('from data basic', async () => {
    const inputData = require(
      resolveFixture('module-graph-basic.json'),
    ) as SDK.ModuleGraphData;
    const moduleGraph = ModuleGraph.fromData(inputData);

    expect(moduleGraph.size()).toBe(inputData.modules.length);

    inputData.modules.forEach((item) => {
      const module = moduleGraph.getModuleById(item.id)!;
      expect(module).toBeTruthy();
      expect(module.kind).toBe(item.kind);
      expect(module.getSize()).toStrictEqual(item.size);
      arrayEq(
        module.getDependencies().map((item) => item.id),
        item.dependencies,
      );
      arrayEq(
        module.getImported().map((item) => item.id),
        item.imported,
      );

      if (!item.meta) {
        expect(module.meta).toStrictEqual({
          hasSetEsModuleStatement: false,
          strictHarmonyModule: false,
        });
      } else {
        expect(module.meta.hasSetEsModuleStatement).toStrictEqual(
          item.meta.hasSetEsModuleStatement ?? false,
        );
        expect(module.meta.strictHarmonyModule).toStrictEqual(
          item.meta.strictHarmonyModule ?? false,
        );
      }
    });

    inputData.dependencies.forEach((item) => {
      const dependency = moduleGraph.getDependencyById(item.id)!;
      expect(dependency).toBeTruthy();
      expect(dependency.id).toBe(item.id);
      expect(dependency.request).toBe(item.request);
      expect(dependency.resolvedRequest).toBe(item.resolvedRequest);
      expect(dependency.module.id).toBe(item.module);
      expect(dependency.dependency.id).toBe(item.dependency);
    });

    const pkgGraph = PackageGraph.fromModuleGraph(moduleGraph, '.');
    const pkgData = pkgGraph.toData();
    expect(pkgData.packages[0].root).toBeTruthy(); // TODO: test error
    pkgData.packages.forEach((pkg) => (pkg.root = ''));
    expect(pkgData).toMatchSnapshot();
  });

  it('ModuleGraph toCodeMap', async () => {
    const _moduleGraph = new ModuleGraph();
    for (let i = 1; i < 10; i++) {
      const _mod = new Module(i.toString(), `index-${i}.js`);
      _mod.setSource({
        source: `source-${i}`,
        transformed: `source-${i}`,
        parsedSource: `source-${i}`,
      });
      _moduleGraph.addModule(_mod);
    }

    expect(_moduleGraph.toCodeData()).toMatchSnapshot();
  });
});

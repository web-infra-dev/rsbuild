import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWorkspaceRoot } from '../src/helpers/workspace';

let root: string;
let app: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rsbuild-workspace-'));
  app = join(root, 'packages', 'app');
  mkdirSync(app, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

test.each([
  ['pnpm-workspace.yaml', 'packages: ["packages/*"]'],
  ['lerna.json', '{}'],
  ['package.json', '{"workspaces":["packages/*"]}'],
])('should find a workspace with %s', (file, content) => {
  writeFileSync(join(root, file), content);
  writeFileSync(join(app, 'package.json'), '{}');
  expect(findWorkspaceRoot(app)).toBe(root);
});

test('should prefer the nearest workspace root', () => {
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: ["packages/*"]');
  writeFileSync(join(app, 'package.json'), '{"workspaces":["nested"]}');
  const nested = join(app, 'nested');
  mkdirSync(nested);
  expect(findWorkspaceRoot(nested)).toBe(app);
});

test('should fall back to the nearest package root even with invalid package.json', () => {
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(join(app, 'package.json'), '{ invalid json');
  const nested = join(app, 'nested');
  mkdirSync(nested);
  expect(findWorkspaceRoot(nested)).toBe(app);
});

test('should fall back to the starting directory without a package or workspace', () => {
  expect(findWorkspaceRoot(app)).toBe(app);
});

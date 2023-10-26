import envinfo from 'envinfo';
import { exec } from 'child_process';

export const getCPUInfo = () =>
  envinfo.helpers.getCPUInfo().then((res) => res[1]);

export const getOSInfo = () =>
  envinfo.helpers.getOSInfo().then((res) => res[1]);

export const getMemoryInfo = () =>
  envinfo.helpers.getMemoryInfo().then((res) => res[1]);

export const getNodeVersion = () =>
  envinfo.helpers.getNodeInfo().then((res) => res[1]);

export const getYarnVersion = () =>
  envinfo.helpers.getYarnInfo().then((res) => res[1]);

export const getNpmVersion = () =>
  envinfo.helpers.getnpmInfo().then((res) => res[1]);

export function getNpmPackageVersion(pkg: string): Promise<string>;
export function getNpmPackageVersion(pkgs: string[]): Promise<string[]>;
export function getNpmPackageVersion(pkg: unknown): Promise<unknown> {
  const isArray = Array.isArray(pkg);
  return envinfo
    .run(
      {
        npmPackages: isArray ? pkg : [pkg],
      },
      { json: true, showNotFound: true },
    )
    .then((res) => {
      const { npmPackages = {} } = JSON.parse(res) || {};
      return isArray
        ? pkg.map((e) => npmPackages[e] || 'Not Found')
        : npmPackages[pkg as string];
    });
}

export function getGlobalNpmPackageVersion(pkg: string): Promise<string>;
export function getGlobalNpmPackageVersion(pkgs: string[]): Promise<string[]>;
export function getGlobalNpmPackageVersion(pkg: unknown): Promise<unknown> {
  const isArray = Array.isArray(pkg);
  return envinfo
    .run(
      {
        npmGlobalPackages: isArray ? pkg : [pkg],
      },
      { json: true, showNotFound: true },
    )
    .then((res) => {
      const { npmGlobalPackages = {} } = JSON.parse(res) || {};
      return isArray
        ? pkg.map((e) => npmGlobalPackages[e] || 'Not Found')
        : npmGlobalPackages[pkg as string];
    });
}

export function getGitBranch() {
  return new Promise<string>((resolve, reject) => {
    exec('git branch --show-current', (err, stdout) => {
      if (err) {
        exec('git branch', (err, stdout) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              stdout
                .split('\n')
                .map((e) => e.replace('* ', ''))
                .join('')
                .trim(),
            );
          }
        });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function getGitRepo() {
  return new Promise<string>((resolve, reject) => {
    exec('git config --get remote.origin.url', (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

import { Plugin } from '@rsbuild/doctor-types';
import path from 'path';
import fs from 'fs';
import { debug } from '@rsbuild/doctor-utils/logger';
import { generateReport } from 'webpack-bundle-analyzer/lib/viewer';
import { DoctorOutputFolder } from '@rsbuild/doctor-types/dist/constants';

export const TileGraphReportName = 'rsbuild-doctor-tile-graph.html';

type IGenerateReportOpts = {
  reportFilename: string;
  reportTitle?: string;
  bundleDir?: string;
  openBrowser?: boolean;
};
async function generateJSONReportUtil(
  bundleStats: Plugin.BaseStats,
  opts: IGenerateReportOpts,
) {
  await generateReport(bundleStats, {
    ...opts,
    logger: {
      warn: () => {},
      info: () => {},
      error: (e: any) => {
        console.log(e);
      },
    },
  });
}

export async function generateTileGraph(
  bundleStats: Plugin.BaseStats,
  opts: IGenerateReportOpts,
  buildOutputPath: string,
) {
  try {
    const tileReportHtmlDir = path.join(buildOutputPath, DoctorOutputFolder);
    console.log(tileReportHtmlDir);
    if (!fs.existsSync(tileReportHtmlDir)) {
      fs.mkdirSync(tileReportHtmlDir);
    }
    const { reportFilename } = opts;
    await generateJSONReportUtil(bundleStats, {
      ...opts,
      openBrowser: false,
      bundleDir: tileReportHtmlDir,
    });

    return path.join(tileReportHtmlDir, `${reportFilename}`);
  } catch (e) {
    debug(() => `Generate webpack-bundle-analyzer tile graph has error:${e}`);
    return null;
  }
}

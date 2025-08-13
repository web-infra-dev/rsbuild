import fs from 'node:fs';
import path from 'node:path';
import { color } from '../helpers';
import { logger } from '../logger';
import { rspack } from '../rspack';
import type { RsbuildPlugin } from '../types';

enum TracePreset {
  OVERVIEW = 'OVERVIEW', // contains overview trace events
  ALL = 'ALL', // contains all trace events
}

function resolveLayer(value: TracePreset): string {
  const overviewTraceFilter = 'info';
  const allTraceFilter = 'trace';

  if (value === TracePreset.OVERVIEW) {
    return overviewTraceFilter;
  }
  if (value === TracePreset.ALL) {
    return allTraceFilter;
  }

  return value;
}

async function ensureFileDir(outputFilePath: string) {
  const dir = path.dirname(outputFilePath);
  await fs.promises.mkdir(dir, { recursive: true });
}

/**
 * `RSPACK_PROFILE=ALL` // all trace events
 * `RSPACK_PROFILE=OVERVIEW` // overview trace events
 * `RSPACK_PROFILE=warn,tokio::net=info` // trace filter from  https://docs.rs/tracing-subscriber/latest/tracing_subscriber/filter/struct.EnvFilter.html#example-syntax
 */
async function applyProfile(
  root: string,
  filterValue: TracePreset,
  traceLayer = 'perfetto',
  traceOutput?: string,
) {
  if (traceLayer !== 'perfetto' && traceLayer !== 'logger') {
    throw new Error(`unsupported trace layer: ${traceLayer}`);
  }

  if (!traceOutput) {
    const timestamp = Date.now();
    const defaultOutputDir = path.join(
      root,
      `.rspack-profile-${timestamp}-${process.pid}`,
    );
    const defaultRustTracePerfettoOutput = path.join(
      defaultOutputDir,
      'rspack.pftrace',
    );
    const defaultRustTraceLoggerOutput = 'stdout';

    const defaultTraceOutput =
      traceLayer === 'perfetto'
        ? defaultRustTracePerfettoOutput
        : defaultRustTraceLoggerOutput;

    traceOutput = defaultTraceOutput;
  }

  const filter = resolveLayer(filterValue);

  await ensureFileDir(traceOutput);
  await rspack.experiments.globalTrace.register(
    filter,
    traceLayer,
    traceOutput,
  );

  return traceOutput;
}

// Referenced from Rspack CLI
// https://github.com/web-infra-dev/rspack/blob/v1.3.9/packages/rspack-cli/src/utils/profile.ts
export const pluginRspackProfile = (): RsbuildPlugin => ({
  name: 'rsbuild:rspack-profile',

  setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    const { RSPACK_PROFILE } = process.env;
    if (!RSPACK_PROFILE) {
      return;
    }

    let traceOutput: string;

    const onStart = async () => {
      traceOutput = await applyProfile(
        api.context.rootPath,
        RSPACK_PROFILE as TracePreset,
        process.env.RSPACK_TRACE_LAYER,
        process.env.RSPACK_TRACE_OUTPUT,
      );
    };

    api.onBeforeBuild(({ isFirstCompile }) => {
      if (isFirstCompile) {
        onStart();
      }
    });
    api.onBeforeStartDevServer(onStart);

    api.onExit(() => {
      if (!traceOutput) {
        return;
      }

      rspack.experiments.globalTrace.cleanup();
      logger.info(`profile file saved to ${color.cyan(traceOutput)}`);
    });
  },
});

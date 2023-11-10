import type { Hook } from 'tapable';
import type { SDK } from '@rsbuild/doctor-types';
import type { DoctorWebpackSDK } from '@rsbuild/doctor-sdk/sdk';
import { DevToolError } from '@rsbuild/doctor-sdk/error';

export function reportPluginData(
  sdk: DoctorWebpackSDK,
  hook: string,
  tapName: string,
  start: number,
  type: SDK.PluginHookData['type'],
  res: unknown,
  err?: Error,
) {
  const end = Date.now();
  sdk.reportPlugin({
    [hook]: [
      {
        tapName,
        costs: end - start,
        startAt: start,
        endAt: end,
        type,
        result: null, // there are circular structure in json
        error: err
          ? [
              new DevToolError(`${tapName} ${hook} Error`, err.message, {
                controller: { noStack: false, noColor: true },
                stack: err.stack,
              }),
            ]
          : [],
      },
    ],
  });
}

export function interceptPluginHook(
  sdk: DoctorWebpackSDK,
  name: string,
  hook: Hook<any, any>,
) {
  if (!hook.intercept) {
    return;
  }

  hook.intercept({
    register(tap) {
      // if (tap.name === pluginTapName) return tap;
      const o = tap.fn;

      if (tap.type === 'sync') {
        tap.fn = function () {
          const start = Date.now();
          try {
            const res = o.apply(this, arguments);
            reportPluginData(sdk, name, tap.name, start, tap.type, res);
            return res;
          } catch (error) {
            reportPluginData(
              sdk,
              name,
              tap.name,
              start,
              tap.type,
              null,
              error as Error,
            );
            throw error;
          }
        };
      } else if (tap.type === 'async') {
        tap.fn = async function () {
          const start = Date.now();
          try {
            const res = await o.apply(this, arguments);
            reportPluginData(sdk, name, tap.name, start, tap.type, res);
            return res;
          } catch (error) {
            reportPluginData(
              sdk,
              name,
              tap.name,
              start,
              tap.type,
              null,
              error as Error,
            );
            throw error;
          }
        };
      } else if (tap.type === 'promise') {
        tap.fn = function () {
          const start = Date.now();

          // Only need to go to arguments for the 0th array value to judge because beforeCompile and afterCompile have only one parameter value.
          // This isChild() judge just for summary plugin & tapPromise, packages/shared-plugin/src/plugins/summary.ts file line:38 & line:48.
          const isChild = arguments?.[0]?.compiler?.isChild();

          return o
            .apply(this, arguments)
            .then((res: unknown) => {
              if (isChild) return res;
              reportPluginData(sdk, name, tap.name, start, tap.type, res);
              return res;
            })
            .catch((error: Error) => {
              reportPluginData(
                sdk,
                name,
                tap.name,
                start,
                tap.type,
                null,
                error,
              );
              throw error;
            });
        };
      }

      return tap;
    },
  });
}

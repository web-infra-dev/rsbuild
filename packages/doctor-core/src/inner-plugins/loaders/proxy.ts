import { Utils as BuildUtils } from '@/build-utils/build';

import { Plugin } from '@rsbuild/doctor-types';
import {
  getOriginLoaderModule,
  reportLoader,
  shouldSkipLoader,
} from '../utils';
import type { ProxyLoaderOptions } from '@/types';
import type { LoaderContext } from 'webpack';

const loaderModule: Plugin.LoaderDefinition<ProxyLoaderOptions, {}> = function (
  ...args
) {
  if (shouldSkipLoader(this)) {
    this.callback(null, ...args);
    return;
  }

  this.cacheable(false);

  const mod = getOriginLoaderModule(this);

  if (mod.default) {
    // https://webpack.js.org/api/loaders/#raw-loader
    if (mod.raw === false && Buffer.isBuffer(args[0])) {
      args[0] = args[0].toString();
    }

    let start: number;
    let startHRTime: [number, number];

    const trap = BuildUtils.createLoaderContextTrap.call(
      this,
      (err, res, sourceMap) => {
        reportLoader(
          this,
          start,
          startHRTime,
          false,
          false,
          args[0].toString(),
          err,
          res,
          sourceMap,
        );
      },
    );

    start = Date.now();
    startHRTime = process.hrtime();

    try {
      const result = mod.default.apply(trap, args);

      // sync function
      if (result) {
        if (!(result instanceof Promise)) {
          reportLoader(
            this,
            start,
            startHRTime,
            false,
            true,
            args[0].toString(),
            null,
            result,
          );
        }
      }

      return result;
    } catch (error) {
      reportLoader(
        this,
        start,
        startHRTime,
        false,
        true,
        args[0].toString(),
        error as Error,
        null,
      );
      throw error;
    }
  }
  this.callback(null, ...args);
};

loaderModule.pitch = function (this: LoaderContext<ProxyLoaderOptions>) {
  if (shouldSkipLoader(this)) {
    return;
  }

  this.cacheable(false);

  const mod = getOriginLoaderModule(this);

  if (mod.pitch && typeof mod.pitch === 'function') {
    let start: number;
    let startHRTime: [number, number];

    const trap = BuildUtils.createLoaderContextTrap.call(this, (err, res) => {
      reportLoader(
        this,
        start,
        startHRTime,
        true,
        false,
        err ? 'Loader Pitch Async Error' : '',
        err,
        res,
      );
    });

    start = Date.now();
    startHRTime = process.hrtime();

    try {
      // @ts-ignore
      const res = mod.pitch.apply(trap, arguments);

      // with pitch result
      if (res) {
        if (!(res instanceof Promise)) {
          reportLoader(this, start, startHRTime, true, true, '', null, res);
        }
      }

      return res;
    } catch (error) {
      reportLoader(
        this,
        start,
        startHRTime,
        true,
        true,
        'Loader Pitch Sync Error',
        error as Error,
        null,
      );
      throw error;
    }
  }
};

// set `raw: true` for every resources, so that can control the result for the correct loader.
// @ts-ignore
loaderModule.raw = true;

// @ts-ignore
export = loaderModule;

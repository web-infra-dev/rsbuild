import { singleUseValue } from 'single-use-dependency';

Promise.all([import('./routeA'), import('./routeB')]).then(
  ([{ getRouteA }, { getRouteB }]) => {
    console.log(singleUseValue, getRouteA(), getRouteB());
  },
);

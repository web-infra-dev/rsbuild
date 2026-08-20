Promise.all([import('./routeA'), import('./routeB')]).then(
  ([{ getRouteA }, { getRouteB }]) => {
    console.log(getRouteA(), getRouteB());
  },
);

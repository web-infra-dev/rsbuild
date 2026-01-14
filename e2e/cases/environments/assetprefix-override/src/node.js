console.log('Node Bundle');

// Import an async chunk to test chunk loading path
import('./nodeAsync.js').then((module) => {
  console.log(module.default);
});

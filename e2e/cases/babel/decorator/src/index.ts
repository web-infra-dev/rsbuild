import { FooService } from './decorator';

console.log(FooService);

// @ts-ignore
window.FooService = FooService;

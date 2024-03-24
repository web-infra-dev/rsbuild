class BarService {}

const injectable = (..._args) => {
  window.aaa = 'hello';
};

const inject = (arg0, ..._args) => {
  if (arg0 === BarService) {
    window.bbb = 'world';
  }
};

@injectable()
export class FooService {
  @inject(BarService)
  barService;
}

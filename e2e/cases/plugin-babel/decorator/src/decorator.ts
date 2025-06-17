class BarService {}

const injectable: any = (..._args: any[]) => {
  return () => {
    // @ts-ignore
    window.aaa = 'hello';
  };
};

const inject: any = (arg0: any, ..._args: any[]) => {
  return () => {
    if (arg0 === BarService) {
      // @ts-ignore
      window.bbb = 'world';
    }
  };
};

@injectable()
export class FooService {
  @inject(BarService)
  barService!: BarService;
}

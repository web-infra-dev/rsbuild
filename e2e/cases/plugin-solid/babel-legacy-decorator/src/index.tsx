import { render } from '@solidjs/web';

let decoratedParameterIndex = -1;

const trackParameter =
  (): ParameterDecorator => (_target, _propertyKey, parameterIndex) => {
    decoratedParameterIndex = parameterIndex;
  };

class ViewModel {
  constructor(
    @trackParameter()
    readonly message: string,
  ) {}
}

const viewModel = new ViewModel('legacy decorator works');
const App = () => (
  <div id="decorator">
    {viewModel.message}: {decoratedParameterIndex}
  </div>
);

render(App, document.getElementById('root')!);

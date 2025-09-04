declare global {
  interface Window {
    decoratorTest: {
      className: string;
      logged: string[];
    };
  }
}

// Class decorator that adds metadata
function classDecorator(name: string) {
  return <T extends { new (...args: any[]): object }>(ctor: T) => {
    const extended = class extends ctor {
      className = name;
    };
    return extended as T;
  };
}

class TestService {
  testMethod() {
    return 'method executed';
  }

  anotherMethod() {
    return 'another method executed';
  }
}

// Apply class decorator manually to ensure compatibility
const DecoratedTestService = classDecorator('TestService')(TestService);

// Apply method decorators manually for better compatibility
const originalTestMethod = DecoratedTestService.prototype.testMethod;
DecoratedTestService.prototype.testMethod = function () {
  window.decoratorTest.logged.push('testMethod called');
  return originalTestMethod.call(this);
};

const originalAnotherMethod = DecoratedTestService.prototype.anotherMethod;
DecoratedTestService.prototype.anotherMethod = function () {
  window.decoratorTest.logged.push('anotherMethod called');
  return originalAnotherMethod.call(this);
};

// Initialize test results
window.decoratorTest = {
  className: '',
  logged: [],
};

// Test the decorators
const service = new DecoratedTestService();
window.decoratorTest.className = (service as any).className;

// Call methods to test method decorator
service.testMethod();
service.anotherMethod();

export {};

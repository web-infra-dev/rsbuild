import React from 'react';

interface Props {
  elementId: string;
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error: null | Error },
  unknown
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <pre id={this.props.elementId}>{this.state?.error?.toString()}</pre>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

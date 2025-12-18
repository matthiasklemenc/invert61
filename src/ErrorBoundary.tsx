import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Fix: Using React.Component explicitly ensures that instance properties like state, props, and setState are correctly recognized by TypeScript.
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Fix: Inherited setState is now recognized from React.Component base class.
    this.setState({ error, errorInfo });
  }

  public render() {
    // Fix: state property is correctly defined on the instance via React.Component.
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-2xl w-full border border-red-500/30">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
            <p className="text-gray-300 mb-6">
              The application encountered a critical error. Please try reloading.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-h-64 mb-6 border border-white/10">
              <p className="text-red-400 font-mono text-sm font-bold mb-2">
                {this.state.error && this.state.error.toString()}
              </p>
              <pre className="text-gray-500 font-mono text-xs whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    // Fix: props property is correctly defined on the instance via React.Component.
    return this.props.children;
  }
}

export default ErrorBoundary;
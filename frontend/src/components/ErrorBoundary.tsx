import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <h1 className="text-2xl font-bold">Something went wrong</h1>
              </div>
              <p className="text-gray-300 mb-4">
                An error occurred while rendering this page. Please try refreshing or contact support if the problem persists.
              </p>
              {this.state.error && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded border border-gray-700">
                  <p className="text-sm font-mono text-red-400 mb-2">Error:</p>
                  <p className="text-sm text-gray-400 break-all">{this.state.error.message}</p>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded border border-gray-700">
                  <p className="text-sm font-mono text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


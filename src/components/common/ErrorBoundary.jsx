import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // If the error is caused by a third-party Chrome extension script, ignore it
    if (
      error?.message?.includes('chrome-extension://') ||
      error?.stack?.includes('chrome-extension://')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ignore Chrome extension injected errors
    if (
      error?.message?.includes('chrome-extension://') ||
      error?.stack?.includes('chrome-extension://')
    ) {
      return;
    }
    console.warn('[ErrorBoundary] Caught runtime exception:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            An unexpected error occurred while rendering this section.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-xl bg-[#2f9e44] hover:bg-[#28863a] text-white text-xs font-bold font-mono inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

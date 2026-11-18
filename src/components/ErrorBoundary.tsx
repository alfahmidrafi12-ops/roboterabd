import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable) as { error?: string; path?: string };
      if (parsed.error) {
        readable = parsed.path ? `${parsed.error} (${parsed.path})` : parsed.error;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-7 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#06142E]">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Robotera BD encountered a temporary issue loading this view.
              </p>
              {this.state.message && (
                <p className="mt-3 text-xs font-mono text-slate-500 bg-[#F6F8FB] border border-slate-200 rounded-lg p-3 break-words">
                  {this.state.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Storefront</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

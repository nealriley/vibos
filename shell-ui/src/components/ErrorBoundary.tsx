import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-8">
          <div className="max-w-md w-full text-center">
            {/* Error icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Error message */}
            <h2 className="text-xl font-medium text-zinc-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              The application encountered an unexpected error. You can try again or reload the page.
            </p>

            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors">
                  Show error details
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 overflow-auto max-h-40">
                  <code className="text-xs text-red-400 whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                  </code>
                  {this.state.errorInfo?.componentStack && (
                    <code className="block mt-2 text-xs text-zinc-500 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </code>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

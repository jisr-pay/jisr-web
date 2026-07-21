import { Component, ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('root');

// App-wide safety net. If any render error escapes a feature-level boundary,
// this shows a recoverable fallback instead of a blank white/black page.
export class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    log.error('Uncaught render error', { error, info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          The page hit an unexpected error. Reloading usually fixes it — your
          wallet and funds are unaffected.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-6 rounded-lg transition-all"
        >
          Reload
        </button>
      </div>
    );
  }
}

import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Landing from '@/pages/Landing';
import { I18nProvider, useI18nContext } from '@/contexts/I18nContext';
import { JisrCopilot } from '@/components/JisrCopilot';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { ChunkLoadRecovery } from '@/components/ChunkLoadRecovery';
import { createLogger } from '@/lib/logger';

import { ThemeProvider } from 'next-themes';

// Route-level code splitting: the payment dashboard pulls in the Stellar SDK
// and Freighter bridge, so it loads only when someone actually visits /app.
const Home = lazy(() => import('@/pages/Home'));

const queryClient = new QueryClient();
const log = createLogger('app');

function Router() {
  const { t } = useI18nContext();
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app">
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground" role="status" aria-live="polite">{t('loading')}</div>}>
          <Home />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Capture anything that escapes React so it is logged rather than lost.
    const onError = (e: ErrorEvent) => log.error('window error', e.message);
    const onRejection = (e: PromiseRejectionEvent) =>
      log.error('unhandled promise rejection', e.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <RootErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
              <JisrCopilot />
              <ChunkLoadRecovery />
              <Toaster />
            </TooltipProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}

export default App;

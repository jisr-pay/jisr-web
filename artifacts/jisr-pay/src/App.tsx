import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/pages/Home';
import Landing from '@/pages/Landing';
import { I18nProvider } from '@/contexts/I18nContext';
import { JisrCopilot } from '@/components/JisrCopilot';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { createLogger } from '@/lib/logger';
import { useEffect } from 'react';

import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();
const log = createLogger('app');

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Home} />
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
              <Toaster />
            </TooltipProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}

export default App;

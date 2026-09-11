import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useI18nContext } from '@/contexts/I18nContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('chunk-recovery');

// Matches the dynamic-import failures Vite emits when a deploy replaces
// chunks the browser still holds: "Failed to fetch dynamically imported
// module ...", "Importing a module script failed.", CSS onload errors, and
// Webpack-style "Loading chunk N failed." kept for completeness.
const CHUNK_ERROR_PATTERN =
  /dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk \S+ failed/i;

export function isChunkLoadError(message: string): boolean {
  return CHUNK_ERROR_PATTERN.test(message);
}

// Global listener for failed lazy-chunk loads. A stale deploy is the usual
// cause: the browser holds an old index that points at hashes the server no
// longer serves, so route-level imports (Home) start failing. A reload
// fetches the new index and the fresh hashes, so we offer one.
export function ChunkLoadRecovery() {
  const { t } = useI18nContext();
  const firedRef = useRef(false);

  useEffect(() => {
    const announce = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      toast({
        title: t('chunkLoadTitle'),
        description: t('chunkLoadDesc'),
        variant: 'destructive',
        duration: Number.POSITIVE_INFINITY,
        action: (
          <ToastAction altText={t('chunkLoadAction')} onClick={() => window.location.reload()}>
            {t('chunkLoadAction')}
          </ToastAction>
        ),
      });
    };

    const onError = (e: ErrorEvent) => {
      if (e.message && isChunkLoadError(e.message)) {
        log.error('chunk load failed', e.message);
        announce();
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : '';
      if (message && isChunkLoadError(message)) {
        log.error('chunk load failed (promise)', message);
        announce();
      }
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [t]);

  return null;
}

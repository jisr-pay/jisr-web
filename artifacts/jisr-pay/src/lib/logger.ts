// Lightweight structured client-side logger.
//
// There is no backend to ship logs to, so this wraps the console with levels,
// a namespace, and structured context. In production only warn/error are
// emitted (debug/info are suppressed) to keep the console clean; everything is
// funneled through one place so it can later be pointed at a real sink
// (Sentry, LogRocket, a /logs endpoint) without touching call sites.

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const isProd = import.meta.env.PROD;
const MIN_LEVEL: Level = isProd ? 'warn' : 'debug';

function emit(level: Level, scope: string, message: string, context?: unknown) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;
  const prefix = `[jisr:${scope}]`;
  const payload = context === undefined ? [prefix, message] : [prefix, message, context];
  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(...payload);
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: unknown) => emit('debug', scope, message, context),
    info: (message: string, context?: unknown) => emit('info', scope, message, context),
    warn: (message: string, context?: unknown) => emit('warn', scope, message, context),
    error: (message: string, context?: unknown) => emit('error', scope, message, context),
  };
}

export type Logger = ReturnType<typeof createLogger>;

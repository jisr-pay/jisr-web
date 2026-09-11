// SDK logging with an explicit sink.
//
// The SDK core must stay environment-agnostic: browser, Node, workers. Logs
// go through one injectable sink instead of reaching for app-only deps. The
// default sink writes to the console when one exists; hosts that need
// structured or silent logging call `setLogSink`.

type Level = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
}

export type LogSink = (level: Level, scope: string, message: string, context?: unknown) => void;

const defaultSink: LogSink = (level, scope, message, context) => {
  if (typeof console === 'undefined') return;
  const prefix = `[jisr-sdk:${scope}]`;
  const payload = context === undefined ? [prefix, message] : [prefix, message, context];
  (console[level] ?? console.log)(...payload);
};

let sink: LogSink = defaultSink;

/** Replace where SDK logs go; pass a no-op to silence them. */
export function setLogSink(next: LogSink): void {
  sink = next;
}

export function createLogger(scope: string): Logger {
  const emit = (level: Level) => (message: string, context?: unknown) =>
    sink(level, scope, message, context);
  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
  };
}

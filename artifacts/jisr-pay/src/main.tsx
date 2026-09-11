import { createRoot } from 'react-dom/client';
import { setLogSink } from '@workspace/jisr-sdk';

import App from './App';

import './index.css';

// App logging policy, applied to the SDK's injectable sink: keep the
// production console clean by suppressing debug/info. All app and SDK logs
// flow through this one place so they can later be pointed at a real sink
// without touching call sites.
setLogSink((level, scope, message, context) => {
  if (import.meta.env.PROD && (level === 'debug' || level === 'info')) return;
  const prefix = `[jisr:${scope}]`;
  const payload = context === undefined ? [prefix, message] : [prefix, message, context];
  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(...payload);
});

createRoot(document.getElementById('root')!).render(<App />);

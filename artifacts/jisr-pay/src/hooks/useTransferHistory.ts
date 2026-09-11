import { useCallback, useEffect, useRef, useState } from 'react';
import { HISTORY_KEY, readTransfers, saveTransfer, type SavedTransfer } from '@/lib/transfer-history';

const HISTORY_UPDATED = 'jisr-pay:history-updated';

function readBrowserHistory() {
  try {
    return { transfers: readTransfers(window.localStorage), unavailable: false };
  } catch {
    return { transfers: [] as SavedTransfer[], unavailable: true };
  }
}

export function useTransferHistory() {
  const [state, setState] = useState(readBrowserHistory);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => setState(readBrowserHistory());
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY || event.key === null) refresh();
    };
    window.addEventListener(HISTORY_UPDATED, refresh);
    window.addEventListener('storage', onStorage);
    // Covers a write between the initial render and subscription.
    refresh();
    return () => {
      mounted.current = false;
      window.removeEventListener(HISTORY_UPDATED, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const recordTransfer = useCallback((record: SavedTransfer) => {
    try {
      const transfers = saveTransfer(window.localStorage, record);
      if (mounted.current) setState({ transfers, unavailable: false });
      window.dispatchEvent(new Event(HISTORY_UPDATED));
    } catch (error) {
      if (mounted.current) setState(previous => ({ ...previous, unavailable: true }));
      throw error;
    }
  }, []);
  return { ...state, recordTransfer };
}

import { useEffect, useRef, useState } from 'react';
import { type SavedTransfer } from '@workspace/jisr-sdk';
import { useI18nContext } from '@/contexts/I18nContext';
import { HistoryError, RemoteHistory } from '@/lib/remote-history';
import { historyWallet } from '@/lib/history-wallet';

export function RemoteTransferHistory({ walletKey, localTransfers, onRestore }: {
  walletKey: string; localTransfers: SavedTransfer[]; onRestore: (record: SavedTransfer) => unknown;
}) {
  const { t } = useI18nContext();
  const [client] = useState(() => new RemoteHistory(walletKey, window.location.origin, historyWallet));
  const [signedIn, setSignedIn] = useState(false);
  const [records, setRecords] = useState<SavedTransfer[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'remoteReady' | 'remoteError' | 'remoteExpired' | 'remoteWallet' | 'remoteSaved' | 'remoteConflict' | 'remoteUnverified' | null>(null);
  const active = useRef(true);
  const operation = useRef(0);
  const locked = useRef(false);
  const clear = () => { client.logout(); operation.current++; locked.current = false; setBusy(false); setSignedIn(false); setRecords([]); setCursor(null); };
  useEffect(() => {
    active.current = true;
    let checking = false;
    const timer = window.setInterval(async () => {
      if (checking || !client.hasSession) return;
      checking = true;
      const id = operation.current;
      try { await client.assertWallet(); }
      catch {
        if (active.current && id === operation.current) { clear(); setMessage('remoteExpired'); }
      } finally { checking = false; }
    }, 3000);
    return () => { active.current = false; operation.current++; client.logout(); window.clearInterval(timer); };
  }, [client]);
  const run = async (work: (current: () => boolean) => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    const id = ++operation.current;
    const current = () => active.current && id === operation.current;
    setBusy(true); setMessage(null);
    try { await work(current); }
    catch (error) {
      if (!current()) return;
      if (!client.authenticated) { setSignedIn(false); setRecords([]); setCursor(null); }
      const code = error instanceof HistoryError ? error.code : 'unavailable';
      setMessage(code === 'expired' ? 'remoteExpired' : code === 'wallet' ? 'remoteWallet' :
        code === 'conflict' ? 'remoteConflict' : code === 'unverified' ? 'remoteUnverified' : 'remoteError');
    } finally { if (current()) { locked.current = false; setBusy(false); } }
  };
  const load = (more = false) => run(async current => {
    const page = await client.list(more ? cursor ?? undefined : undefined);
    if (current()) { setRecords(previous => more ? [...previous, ...page.records] : page.records); setCursor(page.nextCursor); }
  });
  const buttonClass = 'min-h-11 rounded-lg bg-secondary px-3 text-sm font-medium disabled:opacity-50';
  return <div className="mt-6 border-t border-border pt-5" aria-busy={busy}>
    <h3 className="text-lg font-semibold">{t('remoteTitle')}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{t('remoteNotice')}</p>
    <div className="mt-3 flex flex-wrap gap-3">
      {!signedIn ? <button className={buttonClass} disabled={busy} onClick={() => run(async current => {
        await client.login();
        if (!current()) return;
        setSignedIn(true);
        const page = await client.list();
        if (current()) { setRecords(page.records); setCursor(page.nextCursor); setMessage('remoteReady'); }
      })}>{t('remoteLogin')}</button> : <>
        <button className={buttonClass} disabled={busy} onClick={() => load()}>{t('remoteRefresh')}</button>
        <button className={buttonClass} onClick={() => { clear(); setMessage(null); }}>{t('remoteLogout')}</button>
      </>}
    </div>
    <p role="status" className="mt-3 text-sm">{busy ? t('remoteBusy') : message ? t(message) : ''}</p>
    {signedIn && <>
      <h4 className="mt-4 font-medium">{t('remoteUpload')}</h4>
      <p className="text-sm text-muted-foreground">{t('remoteUploadHelp')}</p>
      <ul className="mt-3 space-y-2">{localTransfers.filter(record => record.sender === walletKey && record.contractId === null).map(record =>
        <li key={record.hash} className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs break-all" dir="ltr">{record.hash}</span>
          <button className={buttonClass} disabled={busy} onClick={() => run(async current => {
            await client.register(record);
            if (current()) setMessage('remoteSaved');
          })}>{t('remoteSave')}</button>
        </li>)}</ul>
      <h4 className="mt-5 font-medium">{t('remoteRecords')}</h4>
      {records.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{t('remoteEmpty')}</p>}
      <ul className="mt-3 space-y-3">{records.map(record => <li key={record.hash} className="rounded-xl border border-border p-3">
        <p dir="ltr">{record.amount} XLM · {record.submittedAt}</p>
        <p className="text-sm">{t(record.status === 'confirmed' ? 'historyConfirmed' : record.status === 'failed' ? 'historyFailed' : 'historyPending')}</p>
        <p className="font-mono text-xs break-all" dir="ltr">{record.hash}</p>
        <p className="mt-1 text-xs">{t('transferTo')}</p><p className="font-mono text-xs break-all" dir="ltr">{record.recipient}</p>
        <button className={`${buttonClass} mt-2 me-3`} disabled={busy} onClick={() => run(async current => {
          const updated = await client.reconcile(record.hash);
          if (current()) setRecords(previous => previous.map(item => item.hash === updated.hash ? updated : item));
        })}>{t('historyCheck')}</button>
        <button className={`${buttonClass} mt-2`} disabled={busy} onClick={() => run(async current => {
          await client.assertWallet();
          if (!client.authenticated) throw new HistoryError('expired');
          if (current()) { onRestore(record); setMessage('remoteSaved'); }
        })}>{t('remoteRestore')}</button>
      </li>)}</ul>
      {cursor && <button className={`${buttonClass} mt-3`} disabled={busy} onClick={() => load(true)}>{t('remoteMore')}</button>}
    </>}
  </div>;
}

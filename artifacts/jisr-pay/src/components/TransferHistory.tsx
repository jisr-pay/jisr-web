import { useRef, useState } from 'react';
import { Download, ExternalLink, History, Loader2, RefreshCw } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import { useToast } from '@/hooks/use-toast';
import { lookupSettlement } from '@/lib/stellar';
import { applySettlement, settlementDurationMs, type SavedTransfer } from '@/lib/transfer-history';
import { generateReceiptPDF } from '@/lib/receipt';
import { toUserMessage } from '@/lib/errors';

export function TransferHistory({ walletKey }: { walletKey: string | null }) {
  const { t, lang } = useI18nContext();
  const { transfers, unavailable, recordTransfer } = useTransferHistory();
  const { toast } = useToast();
  const [checkingHash, setCheckingHash] = useState<string | null>(null);
  const checkingRef = useRef(false);
  const visible = walletKey ? transfers.filter(record => record.sender === walletKey) : transfers;

  const checkTransfer = async (record: SavedTransfer, download = false) => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setCheckingHash(record.hash);
    try {
      const settlement = await lookupSettlement(record.hash);
      if (!settlement) {
        toast({ title: t('historyStillPending'), description: t('historyPendingHelp') });
        return;
      }
      const updated = applySettlement(record, settlement);
      try { recordTransfer(updated); } catch { throw new Error(t('historySaveWarning')); }
      if (download && updated.status === 'confirmed') {
        await generateReceiptPDF({ amount: updated.amount, currency: updated.asset,
          recipient: updated.recipient, txHash: updated.hash, feePaid: updated.feePaid!,
          contractId: updated.contractId, timestamp: new Date(updated.confirmedAt!),
          settlementTimeSec: settlementDurationMs(updated) / 1000,
        });
        toast({ title: t('historyReceiptReady') });
      } else {
        toast({ title: settlement.successful ? t('historyConfirmed') : t('historyFailed'),
          variant: settlement.successful ? 'default' : 'destructive' });
      }
    } catch (error) {
      toast({ title: t('historyCheckError'), description: toUserMessage(error), variant: 'destructive' });
    } finally {
      checkingRef.current = false;
      setCheckingHash(null);
    }
  };

  const statusLabel = { pending: t('historyPending'), confirmed: t('historyConfirmed'), failed: t('historyFailed') };
  const statusClass = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    failed: 'bg-destructive/10 text-destructive',
  };
  return (
    <section id="transfer-history" aria-labelledby="transfer-history-title" aria-busy={checkingHash !== null} className="w-full max-w-4xl mx-auto px-4 pb-12 scroll-mt-24">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 id="transfer-history-title" className="flex items-center gap-2 text-xl font-bold"><History className="h-5 w-5" aria-hidden="true" />{t('historyTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('historyLocalNotice')}</p>
        {walletKey && <p className="mt-1 text-xs text-muted-foreground">{t('historyWalletFilter')}</p>}
        {unavailable && <p role="alert" className="mt-4 text-sm text-destructive">{t('historySaveBlocked')}</p>}
        {!unavailable && visible.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t('historyEmpty')}</p>}
        <ol className="mt-5 space-y-4">
          {visible.map(record => (
            <li key={record.hash} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold text-lg" dir="ltr">{record.amount} XLM</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[record.status]}`}>{statusLabel[record.status]}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Stellar Testnet · {new Date(record.submittedAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div><dt className="text-muted-foreground">{t('transferTo')}</dt><dd className="font-mono break-all" dir="ltr">{record.recipient}</dd></div>
                <div><dt className="text-muted-foreground">{t('txHash')}</dt><dd className="font-mono break-all text-xs" dir="ltr">{record.hash}</dd></div>
              </dl>
              {record.status === 'pending' && <p className="mt-3 text-sm text-muted-foreground">{t('historyPendingHelp')}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => checkTransfer(record)} disabled={checkingHash !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-medium disabled:opacity-50">
                  {checkingHash === record.hash ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}{t('historyCheck')}
                </button>
                {record.status === 'confirmed' && <button onClick={() => checkTransfer(record, true)} disabled={checkingHash !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{t('downloadReceipt')}</button>}
                <a href={`https://stellar.expert/explorer/testnet/tx/${record.hash}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-primary"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t('viewOnStellar')}</a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

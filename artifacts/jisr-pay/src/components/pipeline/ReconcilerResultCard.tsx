import { motion } from 'framer-motion';
import { Activity, Check, CheckCircle, Copy, Download, ExternalLink, History, RefreshCw } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import type { TransactionResult } from '@/lib/stellar';

interface ReconcilerResultCardProps {
  txResult: TransactionResult | null;
  amount: string;
  step: 'idle' | 'step1' | 'step2' | 'step3' | 'done';
  isPolling: boolean;
  copied: boolean;
  isDownloadingReceipt: boolean;
  showHistoryLink: boolean;
  onCopyHash: () => void;
  onRetrySettlement: () => void;
  onDownloadReceipt: () => void;
  onReset: () => void;
}

export function ReconcilerResultCard({
  txResult, amount, step, isPolling, copied, isDownloadingReceipt, showHistoryLink,
  onCopyHash, onRetrySettlement, onDownloadReceipt, onReset,
}: ReconcilerResultCardProps) {
  const { t } = useI18nContext();

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-center gap-3 mb-2">
        {isPolling ? (
          <><Activity className="w-5 h-5 text-primary animate-pulse" /><span className="text-primary font-medium">{t('awaitingSettlement')}</span></>
        ) : step === 'done' ? (
          <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-emerald-500 font-medium">{t('settled')}</span></>
        ) : (
          <span className="text-amber-500">{t('confirmUnavailable')}</span>
        )}
      </div>

      {txResult && step === 'step3' && (
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`} target="_blank" rel="noreferrer" className="text-primary underline">{t('viewSubmittedTx')}</a>
          {!isPolling && <button onClick={onRetrySettlement} className="text-primary underline">{t('checkConfirmationAgain')}</button>}
        </div>
      )}
      {txResult && step === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/20 to-[#111118] border border-primary/30 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 end-0 p-4 opacity-10 pointer-events-none">
            <CheckCircle className="w-32 h-32" />
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-500 p-2 rounded-full"><Check className="w-6 h-6" /></span>
            {t('paymentComplete')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t('txHash')}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-foreground bg-black/40 px-2 py-1 rounded border border-white/5">{txResult.hash.slice(0, 16)}...</span>
                <button onClick={onCopyHash} className="text-muted-foreground hover:text-foreground transition-colors p-1" title={copied ? 'Copied!' : 'Copy full hash'}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition-colors p-1" title={t('viewOnStellar')}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t('settlementTime')}</span>
              <span className="font-medium text-lg">{(txResult.settlementTimeMs / 1000).toFixed(1)} {t('seconds')}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t('feePaid')}</span>
              <span className="font-medium text-lg">{txResult.feePaid}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t('amountSubmitted')}</span>
              <span className="font-bold text-lg">{amount} XLM (Testnet)</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
            <button
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {t('sendAnother')}
            </button>
            <button
              onClick={onDownloadReceipt}
              disabled={isDownloadingReceipt}
              aria-busy={isDownloadingReceipt}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium py-3 px-6 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {t('downloadReceipt')}
            </button>
            {showHistoryLink && (
              <a
                href="#transfer-history"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-6 rounded-lg transition-all"
              >
                <History className="w-4 h-4" />
                {t('viewHistory')}
              </a>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

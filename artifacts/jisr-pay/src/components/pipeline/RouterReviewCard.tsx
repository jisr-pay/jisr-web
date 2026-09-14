import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { CONTRACT_ID } from '@/lib/corridors';

interface RouterReviewCardProps {
  isResolving: boolean;
  resolvedKey: string | null;
  isBuilding: boolean;
  txBuilt: boolean;
  amount: string;
  senderKey: string | null;
  walletStatus: 'freighter' | 'mobile' | 'none';
  showSignButton: boolean;
  isSubmitting: boolean;
  isHistoryUnavailable: boolean;
  onConnectWallet: () => void;
  onSubmit: () => void;
}

export function RouterReviewCard({
  isResolving, resolvedKey, isBuilding, txBuilt, amount, senderKey, walletStatus,
  showSignButton, isSubmitting, isHistoryUnavailable, onConnectWallet, onSubmit,
}: RouterReviewCardProps) {
  const { t, isRTL } = useI18nContext();

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {isResolving ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
          <span className={isResolving ? 'text-amber-500' : 'text-emerald-500'}>{t('resolvingFederation')}</span>
        </div>
        {resolvedKey && (
          <div className="bg-muted border border-border rounded-lg p-3 ms-8 text-sm font-mono text-muted-foreground flex justify-between items-center break-all">
            {resolvedKey}
          </div>
        )}

        {!isResolving && (
          <div className="flex items-center gap-3 mt-2">
            {isBuilding ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <span className={isBuilding ? 'text-amber-500' : 'text-emerald-500'}>{t('buildingTx')}</span>
          </div>
        )}

        {txBuilt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border rounded-xl p-5 ms-8 flex flex-col gap-4 mt-2 shadow-inner"
          >
            <h3 className="text-lg font-semibold">{t('reviewTransfer')}</h3>
            <dl className="grid gap-3 text-sm">
              <div><dt className="text-muted-foreground">{t('sendAmount')}</dt><dd className="text-2xl font-bold" dir="ltr">{amount} XLM</dd></div>
              <div><dt className="text-muted-foreground">{t('transferNetwork')}</dt><dd>Stellar Testnet</dd></div>
              <div><dt className="text-muted-foreground">{t('transferFrom')}</dt><dd className="font-mono break-all" dir="ltr">{senderKey ?? t('connectWallet')}</dd></div>
              <div><dt className="text-muted-foreground">{t('transferTo')}</dt><dd className="font-mono break-all" dir="ltr">{resolvedKey}</dd></div>
            </dl>
            <p className="text-sm text-muted-foreground">{t('reviewTransferHelp')}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{t('contractAddress')}</span>
                <span className="text-sm font-mono">{CONTRACT_ID().slice(0, 10)}...{CONTRACT_ID().slice(-4)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{t('fee')}</span>
                <span className="text-sm font-medium">Review the transaction and network fee in Freighter</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Est. {t('speed')}</span>
                <span className="text-sm font-medium">~5 {t('seconds')}</span>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-4">
              {walletStatus === 'freighter' ? (
                senderKey ? (
                  <div className="text-emerald-500 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4"/> {t('freighterConnected')}</div>
                ) : (
                  <button onClick={onConnectWallet} className="text-sm bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium transition-colors">
                    {t('connectWallet')}
                  </button>
                )
              ) : walletStatus === 'mobile' ? (
                <div className="text-amber-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {t('freighterMobile')}</div>
              ) : (
                <div className="text-destructive text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {t('installFreighter')}</div>
              )}

              {showSignButton && (
                <button
                  onClick={onSubmit}
                  disabled={!senderKey || !resolvedKey || walletStatus !== 'freighter' || isSubmitting || isHistoryUnavailable}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('signTransfer')}
                  {!isSubmitting && <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

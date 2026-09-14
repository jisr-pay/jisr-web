import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { CORRIDORS, calculateTotal, getBestCorridor, Corridor, CONTRACT_ID } from '@/lib/corridors';
import {
  detectWalletEnvironment, connectFreighter, resolveFederation,
  buildAndSubmitFreighterPayment, pollSettlement, TransactionResult
} from '@/lib/stellar';
import {
  applySettlement,
  classifyError,
  createLogger,
  enforce,
  parseAmountToStroops,
  retryAfter,
  RULES,
  settlementDurationMs,
  toUserMessage,
  type SavedTransfer,
} from '@workspace/jisr-sdk';
import { copyText } from '@/lib/clipboard';
import { generateReceiptPDF, receiptFilename } from '@/lib/receipt';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import { AgentCard } from './pipeline/AgentCard';
import { CorridorScanTable, MARKETING_COMPARE_AMOUNT } from './pipeline/CorridorScanTable';
import { RouterReviewCard } from './pipeline/RouterReviewCard';
import { ReconcilerResultCard } from './pipeline/ReconcilerResultCard';

const log = createLogger('pipeline');

type Step = 'idle' | 'step1' | 'step2' | 'step3' | 'done';

interface AgentPipelineProps {
  /** Public key already connected by the parent (dashboard). Optional — pipeline can also connect internally. */
  walletKey?: string | null;
  /** Called when the pipeline internally connects Freighter, so the parent can sync its display. */
  onWalletChange?: (key: string | null) => void;
}

export function AgentPipeline({ walletKey: externalWalletKey, onWalletChange }: AgentPipelineProps = {}) {
  const { t, isRTL } = useI18nContext();
  const { toast } = useToast();
  const { transfers, recordTransfer, unavailable: historyUnavailable } = useTransferHistory();
  const activeTransferRef = useRef<SavedTransfer | null>(null);

  const [step, setStep] = useState<Step>('idle');
  const [amount, setAmount] = useState<string>('');
  const currency = 'XLM';
  const [recipient, setRecipient] = useState<string>('');

  // Step 1 state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCorridors, setScannedCorridors] = useState<Corridor[]>([]);

  // Step 2 state
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [txBuilt, setTxBuilt] = useState(false);
  const [walletStatus, setWalletStatus] = useState<'freighter' | 'mobile' | 'none'>('none');
  // Use external wallet key from dashboard if provided, fall back to internal state.
  const [internalSenderKey, setInternalSenderKey] = useState<string | null>(null);
  const senderKey = externalWalletKey !== undefined ? externalWalletKey : internalSenderKey;
  const setSenderKey = (key: string | null) => {
    setInternalSenderKey(key);
    onWalletChange?.(key);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 3 state
  const [isPolling, setIsPolling] = useState(false);
  const [txResult, setTxResult] = useState<TransactionResult | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<string>('');

  // Error state — every failure in the pipeline surfaces here
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const downloadingReceiptRef = useRef(false);

  // Refs for cleanup: the scan interval and a mounted flag so we never call
  // setState after the component unmounts (React warning + leaked timers).
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const operationRef = useRef(0);
  const submittingRef = useRef(false);
  const submittedAtRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const showError = (e: unknown) => {
    const msg = toUserMessage(e);
    log.error('Pipeline error', e);
    if (mountedRef.current) setError(msg);
  };

  const saveResult = (record: SavedTransfer) => {
    activeTransferRef.current = record;
    try { recordTransfer(record); } catch {
      toast({ title: t('historySaveWarning'), variant: 'destructive' });
    }
  };

  const handleCopyHash = async () => {
    if (!txResult) return;
    const ok = await copyText(txResult.hash);
    if (!mountedRef.current) return;
    if (ok) {
      setCopied(true);
      setTimeout(() => { if (mountedRef.current) setCopied(false); }, 1500);
      toast({
        title: t('copiedTitle'),
        description: `${txResult.hash.slice(0, 12)}…${txResult.hash.slice(-6)}`,
      });
    } else {
      toast({
        title: t('copiedFallbackTitle'),
        description: t('copiedFallbackDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = async () => {
    if (!txResult || step !== 'done' || downloadingReceiptRef.current) return;
    downloadingReceiptRef.current = true;
    setIsDownloadingReceipt(true);
    try {
      await generateReceiptPDF({
        amount,
        currency,
        recipient: resolvedKey ?? recipient,
        txHash: txResult.hash,
        feePaid: txResult.feePaid,
        settlementTimeSec: txResult.settlementTimeMs / 1000,
        contractId: CONTRACT_ID(),
        timestamp: new Date(txResult.createdAt ?? Date.now()),
      });
      toast({ title: t('receiptDownloaded'), description: receiptFilename(txResult.hash) });
    } catch (error) {
      showError(error);
    } finally {
      downloadingReceiptRef.current = false;
      if (mountedRef.current) setIsDownloadingReceipt(false);
    }
  };

  useEffect(() => {
    setWalletStatus(detectWalletEnvironment());
  }, []);

  const handleStart = () => {
    const value = Number(amount);
    if (!amount || !recipient.trim() || !Number.isFinite(value) || value <= 0) {
      setError(t('validationAmount'));
      return;
    }
    try {
      parseAmountToStroops(amount);
    } catch (e) {
      showError(e);
      return;
    }
    // Client-side rate limit — don't let repeated clicks spam the scan.
    const wait = retryAfter('findRoute', RULES.findRoute);
    if (wait > 0) {
      setError(`Please wait ${Math.ceil(wait / 1000)}s before searching again.`);
      return;
    }
    enforce('findRoute', RULES.findRoute);
    const operation = ++operationRef.current;

    setError(null);
    setStep('step1');
    setIsScanning(true);
    setScannedCorridors([]);

    // Clear any previous scan so rapid restarts can't stack intervals.
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    // Reveal corridors one at a time. Capture the corridor into a local const
    // BEFORE calling setState: the functional updater runs when React flushes
    // it (after index++ has already executed), so reading index inside it would
    // read a stale, out-of-range value and push undefined.
    let index = 0;
    scanIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || operation !== operationRef.current) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        return;
      }
      if (index < CORRIDORS.length) {
        const corridor = CORRIDORS[index];
        index++;
        setScannedCorridors(prev =>
          [...prev, corridor].sort((a, b) => a.feePercent - b.feePercent),
        );
      } else {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setTimeout(() => {
          if (mountedRef.current && operation === operationRef.current) setIsScanning(false);
        }, 500);
      }
    }, 400);
  };

  const handleStep1Proceed = async () => {
    const operation = ++operationRef.current;
    setError(null);
    setStep('step2');
    setIsResolving(true);

    let key: string;
    try {
      key = await resolveFederation(recipient);
    } catch (e) {
      if (!mountedRef.current || operation !== operationRef.current) return;
      setIsResolving(false);
      showError(e);
      setStep('idle');
      return;
    }
    if (!mountedRef.current || operation !== operationRef.current) return;
    setResolvedKey(key);
    setIsResolving(false);

    setIsBuilding(true);
    // Brief UI transition before showing the transaction card
    setTimeout(() => {
      if (!mountedRef.current || operation !== operationRef.current) return;
      setIsBuilding(false);
      setTxBuilt(true);
    }, 800);
  };

  const handleConnectWallet = async () => {
    const key = await connectFreighter();
    if (key) {
      setSenderKey(key);
      setError(null);
    } else {
      setError('Could not connect Freighter. Unlock the extension, approve the connection request, and try again.');
    }
  };

  const handleSubmitTx = async () => {
    if (!senderKey || !resolvedKey) return;
    if (submittingRef.current) return;
    // Rate limit real payments — expensive and irreversible.
    const wait = retryAfter('submitPayment', RULES.submitPayment);
    if (wait > 0) {
      setError(`Please wait ${Math.ceil(wait / 1000)}s before submitting another payment.`);
      return;
    }
    enforce('submitPayment', RULES.submitPayment);

    setError(null);
    submittingRef.current = true;
    submittedAtRef.current = Date.now();
    setIsSubmitting(true);
    try {
      const result = await buildAndSubmitFreighterPayment(senderKey, resolvedKey, amount, {
        onPending: (pending) => {
          const record: SavedTransfer = {
            hash: pending.hash, network: 'TESTNET', asset: 'XLM', sender: senderKey,
            recipient: resolvedKey, amount: amount.trim(), contractId: CONTRACT_ID(),
            submittedAt: new Date().toISOString(), status: 'pending',
          };
          // A failed save stops broadcast before the signed transaction is sent.
          try { recordTransfer(record); } catch { throw new Error(t('historySaveBlocked')); }
          activeTransferRef.current = record;
          if (!mountedRef.current) return;
          setTxResult(pending);
          setStep('step3');
          setIsPolling(true);
        },
        onFailed: (hash) => {
          if (activeTransferRef.current?.hash === hash) saveResult({ ...activeTransferRef.current, status: 'failed' });
        },
      });
      if (mountedRef.current) {
        setTxResult(result);
        setStep('step3');
        setIsPolling(true);
        setSettlementStatus('awaitingSettlement');
      }

      const settled = await pollSettlement(result.hash, setSettlementStatus);
      if (activeTransferRef.current) saveResult(applySettlement(activeTransferRef.current, settled));
      if (!mountedRef.current) return;
      // Replace optimistic values with the confirmed on-chain fee and ledger
      setTxResult(prev =>
        prev ? { ...prev, feePaid: settled.feeCharged, ledger: settled.ledger, createdAt: settled.createdAt } : prev,
      );
      setIsPolling(false);
      setStep('done');
      triggerConfetti();
    } catch (e) {
      if (activeTransferRef.current && classifyError(e) === 'CONTRACT_FAILED') {
        saveResult({ ...activeTransferRef.current, status: 'failed' });
      }
      if (!mountedRef.current) return;
      showError(e);
      setIsSubmitting(false);
      setIsPolling(false);
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  const handleRetrySettlement = async () => {
    if (!txResult || submittingRef.current) return;
    submittingRef.current = true;
    setIsPolling(true);
    setError(null);
    try {
      const settled = await pollSettlement(txResult.hash, setSettlementStatus);
      if (activeTransferRef.current) saveResult(applySettlement(activeTransferRef.current, settled));
      if (!mountedRef.current) return;
      setTxResult({ ...txResult, feePaid: settled.feeCharged, ledger: settled.ledger, createdAt: settled.createdAt,
        settlementTimeMs: activeTransferRef.current ? settlementDurationMs(activeTransferRef.current) : txResult.settlementTimeMs });
      setStep('done');
      triggerConfetti();
    } catch (e) {
      if (activeTransferRef.current && classifyError(e) === 'CONTRACT_FAILED') {
        saveResult({ ...activeTransferRef.current, status: 'failed' });
      }
      showError(e);
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setIsPolling(false);
    }
  };

  const resetPipeline = () => {
    if (submittingRef.current) return;
    operationRef.current++;
    activeTransferRef.current = null;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setStep('idle');
    setAmount('');
    setRecipient('');
    setTxResult(null);
    setError(null);
    setResolvedKey(null);
    setTxBuilt(false);
    setIsSubmitting(false);
    setIsPolling(false);
    setScannedCorridors([]);
    setIsScanning(false);
    setIsResolving(false);
    setIsBuilding(false);
    // Keep senderKey so the user stays "connected" for the next payment.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confetti is lazy-loaded: canvas-confetti only downloads when a payment
  // actually settles, keeping it out of the initial bundle.
  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default;
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#7c3aed', '#f59e0b', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#7c3aed', '#f59e0b', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const worstCorridor = CORRIDORS.find(c => c.id === 'bank-wire');
  const bestCorridor = getBestCorridor(CORRIDORS, MARKETING_COMPARE_AMOUNT);
  const savingsAmount = worstCorridor ? calculateTotal(worstCorridor, MARKETING_COMPARE_AMOUNT) - calculateTotal(bestCorridor, MARKETING_COMPARE_AMOUNT) : 0;
  const savingsPercent = worstCorridor ? (savingsAmount / calculateTotal(worstCorridor, MARKETING_COMPARE_AMOUNT)) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 relative z-20">
      <div className="flex flex-col gap-6">
        {historyUnavailable && <p role="alert" className="text-sm text-destructive">{t('historySaveBlocked')}</p>}
        {step === 'idle' && transfers.some(record => record.status === 'pending' && (!senderKey || record.sender === senderKey)) && (
          <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            {t('historyPendingNotice')} <a href="#transfer-history" className="font-semibold underline">{t('viewHistory')}</a>
          </p>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/40 text-destructive rounded-xl p-4 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm break-words">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-destructive/70 hover:text-destructive transition-colors text-sm font-medium"
              >
                {t('dismiss')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-muted-foreground">
          {t('testnetNotice')}
        </p>
        <motion.div
          layout
          className="bg-card/90 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            <label htmlFor="transfer-amount" className="text-sm text-muted-foreground font-medium">{t('sendAmount')}</label>
            <div className="relative">
              <input
                id="transfer-amount"
                type="number"
                min="0.0000001"
                step="0.0000001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={step !== 'idle'}
                className="w-full bg-input border border-border rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="0.00"
              />
              <div className="absolute top-1 bottom-1 end-1 flex items-center">
                <span className="px-3 text-sm font-medium">{currency}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <label htmlFor="transfer-recipient" className="text-sm text-muted-foreground font-medium">{t('recipientAddress')}</label>
            <input
              id="transfer-recipient"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              disabled={step !== 'idle'}
              className="w-full bg-input border border-border rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              placeholder={t('recipientPlaceholder')}
            />
          </div>

          <div className="w-full md:w-auto">
            {step === 'idle' ? (
              <button
                onClick={handleStart}
                disabled={!amount || !recipient || Number(amount) <= 0}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {t('heroCTA')} <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={resetPipeline}
                disabled={isSubmitting || isPolling}
                className="w-full md:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-6 rounded-lg transition-all"
              >
                {t('reset')}
              </button>
            )}
          </div>
        </motion.div>

        {/* Agents Area */}
        <AnimatePresence>
          {step !== 'idle' && (
            <div className="flex flex-col gap-4">

              {/* Agent 1: Rate-Scout */}
              <AgentCard
                number="01"
                name={t('agent1Name')}
                desc={t('agent1Desc')}
                isActive={step === 'step1'}
                isComplete={step === 'step2' || step === 'step3' || step === 'done'}
              >
                <CorridorScanTable
                  isScanning={isScanning}
                  scannedCorridors={scannedCorridors}
                  bestCorridor={bestCorridor}
                  savingsAmount={savingsAmount}
                  savingsPercent={savingsPercent}
                  showProceed={step === 'step1'}
                  onProceed={handleStep1Proceed}
                />
              </AgentCard>

              {/* Agent 2: Router */}
              {(step === 'step2' || step === 'step3' || step === 'done') && (
                <AgentCard
                  number="02"
                  name={t('agent2Name')}
                  desc={t('agent2Desc')}
                  isActive={step === 'step2'}
                  isComplete={step === 'step3' || step === 'done'}
                >
                  <RouterReviewCard
                    isResolving={isResolving}
                    resolvedKey={resolvedKey}
                    isBuilding={isBuilding}
                    txBuilt={txBuilt}
                    amount={amount}
                    senderKey={senderKey}
                    walletStatus={walletStatus}
                    showSignButton={step === 'step2'}
                    isSubmitting={isSubmitting}
                    isHistoryUnavailable={historyUnavailable}
                    onConnectWallet={handleConnectWallet}
                    onSubmit={handleSubmitTx}
                  />
                </AgentCard>
              )}

              {/* Agent 3: Reconciler */}
              {(step === 'step3' || step === 'done') && (
                <AgentCard
                  name={t('agent3Name')}
                  desc={t('agent3Desc')}
                  isActive={step === 'step3'}
                  isComplete={step === 'done'}
                  number="03"
                >
                  <ReconcilerResultCard
                    txResult={txResult}
                    amount={amount}
                    step={step}
                    isPolling={isPolling}
                    copied={copied}
                    isDownloadingReceipt={isDownloadingReceipt}
                    showHistoryLink={Boolean(senderKey)}
                    onCopyHash={handleCopyHash}
                    onRetrySettlement={handleRetrySettlement}
                    onDownloadReceipt={handleDownloadReceipt}
                    onReset={resetPipeline}
                  />
                </AgentCard>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

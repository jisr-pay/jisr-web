import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, AlertCircle,
  CheckCircle, Loader2, Copy, ExternalLink, Check,
  RefreshCw, History, Download
} from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CORRIDORS, calculateTotal, formatSpeed, getBestCorridor, Corridor, 
  CONTRACT_ID 
} from '@/lib/corridors';
import {
  detectWalletEnvironment, connectFreighter, resolveFederation,
  buildAndSubmitPayment, pollSettlement, TransactionResult
} from '@/lib/stellar';
import { createLogger } from '@/lib/logger';
import { toUserMessage, classifyError } from '@/lib/errors';
import { enforce, retryAfter, RULES } from '@/lib/rateLimit';
import { generateReceiptPDF } from '@/lib/receipt';
import { parseAmountToStroops } from '@/lib/amount';
import { copyText } from '@/lib/clipboard';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import { applySettlement, settlementDurationMs, type SavedTransfer } from '@/lib/transfer-history';

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
    toast({ title: t('receiptDownloaded'), description: `jisr-pay-receipt-${txResult.hash.slice(0, 8)}.pdf` });
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
      const result = await buildAndSubmitPayment(senderKey, resolvedKey, amount, {
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
  // Marketing comparison is a separate USD example, not an XLM exchange quote.
  const numAmount = 500;
  const bestCorridor = getBestCorridor(CORRIDORS, numAmount);
  const savingsAmount = worstCorridor ? calculateTotal(worstCorridor, numAmount) - calculateTotal(bestCorridor, numAmount) : 0;
  const savingsPercent = worstCorridor ? (savingsAmount / calculateTotal(worstCorridor, numAmount)) * 100 : 0;

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
                <div className="flex flex-col gap-4 pt-4">
                  <p className="text-sm text-muted-foreground">{t('scanTableNotice')}</p>
                  <div className="flex items-center gap-3 mb-2">
                    {isScanning ? (
                      <><Activity className="w-5 h-5 text-primary animate-pulse" /><span className="text-primary font-medium">{t('scanning')}</span></>
                    ) : (
                      <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-emerald-500 font-medium">{t('bestRoute')}</span></>
                    )}
                  </div>
                  
                  <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-inner relative">
                    {isScanning && (
                      <motion.div 
                        className="absolute inset-0 bg-primary/5 z-10 pointer-events-none"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}
                    <table className="w-full text-sm text-start min-w-[36rem]">
                      <thead className="bg-muted text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-3 px-4 font-medium">{t('provider')}</th>
                          <th className="py-3 px-4 font-medium">{t('fee')}</th>
                          <th className="py-3 px-4 font-medium">{t('speed')}</th>
                          <th className="py-3 px-4 font-medium text-end">{t('total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {scannedCorridors.map((c, i) => {
                            const isWinner = !isScanning && c.id === bestCorridor.id;
                            return (
                              <motion.tr 
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`border-b border-border/50 last:border-0 ${isWinner ? 'bg-primary/10' : ''}`}
                              >
                                <td className="py-4 px-4 flex items-center gap-2">
                                  <span className={`font-medium ${isWinner ? 'text-primary' : 'text-foreground'}`}>{t(c.nameKey)}</span>
                                  {isWinner && <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold uppercase hidden md:inline-block">{t('bestRouteBadge')}</span>}
                                </td>
                                <td className="py-4 px-4 text-muted-foreground">{c.feePercent}% {c.feeFixed > 0 ? `+ $${c.feeFixed}` : ''}</td>
                                <td className="py-4 px-4 text-muted-foreground">{formatSpeed(c.speedMinutes)}</td>
                                <td className={`py-4 px-4 text-end font-semibold ${isWinner ? 'text-amber-500' : ''}`}>
                                  ${calculateTotal(c, numAmount).toFixed(2)}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {!isScanning && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
                      <div className="text-amber-500 font-medium flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        {t('save')} ${savingsAmount.toFixed(2)} ({savingsPercent.toFixed(0)}%) {t('vsBankWire')}
                      </div>
                      {step === 'step1' && (
                        <button 
                          onClick={handleStep1Proceed}
                          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                        >
                          {t('proceedRoute')} <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
                                <button onClick={handleConnectWallet} className="text-sm bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium transition-colors">
                                  {t('connectWallet')}
                                </button>
                              )
                            ) : walletStatus === 'mobile' ? (
                              <div className="text-amber-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {t('freighterMobile')}</div>
                            ) : (
                              <div className="text-destructive text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {t('installFreighter')}</div>
                            )}

                            {step === 'step2' && (
                              <button 
                                onClick={handleSubmitTx}
                                disabled={!senderKey || !resolvedKey || walletStatus !== 'freighter' || isSubmitting || historyUnavailable}
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
                </AgentCard>
              )}

              {/* Agent 3: Reconciler */}
              {(step === 'step3' || step === 'done') && (
                <AgentCard 
                  number="03" 
                  name={t('agent3Name')} 
                  desc={t('agent3Desc')}
                  isActive={step === 'step3'}
                  isComplete={step === 'done'}
                >
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
                        {!isPolling && <button onClick={handleRetrySettlement} className="text-primary underline">{t('checkConfirmationAgain')}</button>}
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
                              <button onClick={handleCopyHash} className="text-muted-foreground hover:text-foreground transition-colors p-1" title={copied ? 'Copied!' : 'Copy full hash'}>
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
                            onClick={resetPipeline}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all"
                          >
                            <RefreshCw className="w-4 h-4" />
                            {t('sendAnother')}
                          </button>
                          <button
                            onClick={handleDownloadReceipt}
                            disabled={isDownloadingReceipt}
                            aria-busy={isDownloadingReceipt}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium py-3 px-6 rounded-lg transition-all"
                          >
                            <Download className="w-4 h-4" />
                            {t('downloadReceipt')}
                          </button>
                          {senderKey && (
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
                </AgentCard>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentCard({ 
  number, name, desc, isActive, isComplete, children 
}: { 
  number: string; name: string; desc: string; isActive: boolean; isComplete: boolean; children: React.ReactNode 
}) {
  let statusColor = 'bg-muted border-border';
  if (isActive) statusColor = 'bg-card border-primary ring-1 ring-primary shadow-[0_0_20px_rgba(124,58,237,0.15)]';
  if (isComplete) statusColor = 'bg-card border-emerald-500/50';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl transition-[border-color,box-shadow,background-color] duration-300 overflow-hidden ${statusColor} backdrop-blur-sm relative`}
    >
      <div className="p-5 md:p-6 flex flex-col">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : isComplete ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
            {number}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              {name}
              {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              {isComplete && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
        </div>
        
        <AnimatePresence initial={false}>
          {(isActive || isComplete) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Search, Activity, Link as LinkIcon, AlertCircle, 
  CheckCircle, Loader2, Copy, ExternalLink, ChevronDown, Check
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
import confetti from 'canvas-confetti';

type Step = 'idle' | 'step1' | 'step2' | 'step3' | 'done';

export function AgentPipeline() {
  const { t, isRTL } = useI18nContext();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('idle');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
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
  const [senderKey, setSenderKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 3 state
  const [isPolling, setIsPolling] = useState(false);
  const [txResult, setTxResult] = useState<TransactionResult | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<string>('');

  // Error state — every failure in the pipeline surfaces here
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyHash = async () => {
    if (!txResult) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(txResult.hash);
      ok = true;
    } catch {
      // Clipboard API blocked (older browser / insecure context) — fall back
      try {
        const ta = document.createElement('textarea');
        ta.value = txResult.hash;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({
        title: 'Transaction hash copied',
        description: `${txResult.hash.slice(0, 12)}…${txResult.hash.slice(-6)}`,
      });
    } else {
      toast({
        title: 'Could not copy automatically',
        description: 'Select the hash and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    setWalletStatus(detectWalletEnvironment());
  }, []);

  const handleStart = () => {
    if (!amount || !recipient || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setError(null);
    setStep('step1');
    setIsScanning(true);
    setScannedCorridors([]);
    
    // Reveal corridors one at a time. Capture the corridor into a local const
    // BEFORE calling setState: the functional updater runs when React flushes
    // it (after index++ has already executed), so reading index inside it would
    // read a stale, out-of-range value and push undefined.
    let index = 0;
    const interval = setInterval(() => {
      if (index < CORRIDORS.length) {
        const corridor = CORRIDORS[index];
        index++;
        setScannedCorridors(prev =>
          [...prev, corridor].sort((a, b) => a.feePercent - b.feePercent),
        );
      } else {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 500);
      }
    }, 400);
  };

  const handleStep1Proceed = async () => {
    setError(null);
    setStep('step2');
    setIsResolving(true);

    let key: string;
    try {
      key = await resolveFederation(recipient);
    } catch (e) {
      setIsResolving(false);
      setError(e instanceof Error ? e.message : 'Failed to resolve recipient');
      setStep('idle');
      return;
    }
    setResolvedKey(key);
    setIsResolving(false);

    setIsBuilding(true);
    // Brief UI transition before showing the transaction card
    setTimeout(() => {
      setIsBuilding(false);
      setTxBuilt(true);
    }, 800);
  };

  const handleConnectWallet = async () => {
    const key = await connectFreighter();
    if (key) setSenderKey(key);
    else setError('Could not connect Freighter. Approve the connection request in the extension and try again.');
  };

  const handleSubmitTx = async () => {
    if (!senderKey || !resolvedKey) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await buildAndSubmitPayment(senderKey, resolvedKey, amount);
      setTxResult(result);
      setStep('step3');
      setIsPolling(true);
      setSettlementStatus('awaitingSettlement');

      const settled = await pollSettlement(result.hash, setSettlementStatus);
      // Replace optimistic values with the confirmed on-chain fee and ledger
      setTxResult(prev =>
        prev ? { ...prev, feePaid: settled.feeCharged, ledger: settled.ledger } : prev,
      );
      setIsPolling(false);
      setStep('done');
      triggerConfetti();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
      setIsSubmitting(false);
      setIsPolling(false);
    }
  };

  const triggerConfetti = () => {
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

  const bestCorridor = getBestCorridor(CORRIDORS);
  const worstCorridor = CORRIDORS.find(c => c.id === 'bank-wire');
  const numAmount = Number(amount) || 0;
  const savingsAmount = worstCorridor ? calculateTotal(worstCorridor, numAmount) - calculateTotal(bestCorridor, numAmount) : 0;
  const savingsPercent = worstCorridor ? (savingsAmount / calculateTotal(worstCorridor, numAmount)) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 relative z-20 -mt-24">
      <div className="flex flex-col gap-6">

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
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Form (Always visible or transitions out?) The prompt says "Send form (shown in idle state)", implying it might stay or collapse, but let's keep it as the top header once active. */}
        <motion.div 
          layout
          className="bg-card/90 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground font-medium">{t('sendAmount')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={step !== 'idle'}
                className="w-full bg-input border border-border rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="0.00"
              />
              <div className="absolute top-1 bottom-1 end-1 flex items-center">
                <select 
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  disabled={step !== 'idle'}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer disabled:opacity-50 pe-8 appearance-none"
                >
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="KES">KES</option>
                  <option value="NGN">NGN</option>
                </select>
                <div className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground font-medium">{t('recipientAddress')}</label>
            <input 
              type="text" 
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
                onClick={() => { setStep('idle'); setAmount(''); setRecipient(''); setTxResult(null); setError(null); setResolvedKey(null); setTxBuilt(false); setIsSubmitting(false); setIsPolling(false); }}
                className="w-full md:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-6 rounded-lg transition-all"
              >
                Reset
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
                  <div className="flex items-center gap-3 mb-2">
                    {isScanning ? (
                      <><Activity className="w-5 h-5 text-amber-500 animate-pulse" /><span className="text-amber-500 font-medium">{t('scanning')}</span></>
                    ) : (
                      <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-emerald-500 font-medium">{t('bestRoute')}</span></>
                    )}
                  </div>
                  
                  <div className="bg-[#111118] border border-border rounded-xl overflow-hidden shadow-inner relative">
                    {isScanning && (
                      <motion.div 
                        className="absolute inset-0 bg-primary/5 z-10 pointer-events-none"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                    <table className="w-full text-sm text-start">
                      <thead className="bg-[#1a1a24] text-muted-foreground border-b border-border">
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
                                  {isWinner && <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold uppercase hidden md:inline-block">Best Route</span>}
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
                        Save ${savingsAmount.toFixed(2)} ({savingsPercent.toFixed(0)}%) vs. Bank Wire
                      </div>
                      {step === 'step1' && (
                        <button 
                          onClick={handleStep1Proceed}
                          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                        >
                          Proceed with Jisr Stellar route <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
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
                        {isResolving ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        <span className={isResolving ? 'text-amber-500' : 'text-emerald-500'}>{t('resolvingFederation')}</span>
                      </div>
                      {resolvedKey && (
                        <div className="bg-[#111118] border border-border rounded-lg p-3 ms-8 text-sm font-mono text-muted-foreground flex justify-between items-center break-all">
                          {resolvedKey}
                        </div>
                      )}

                      {!isResolving && (
                        <div className="flex items-center gap-3 mt-2">
                          {isBuilding ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                          <span className={isBuilding ? 'text-amber-500' : 'text-emerald-500'}>{t('buildingTx')}</span>
                        </div>
                      )}

                      {txBuilt && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-[#111118] border border-border rounded-xl p-5 ms-8 flex flex-col gap-4 mt-2 shadow-inner"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground block mb-1">{t('contractAddress')}</span>
                              <span className="text-sm font-mono">{CONTRACT_ID.slice(0, 10)}...{CONTRACT_ID.slice(-4)}</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-1">{t('fee')}</span>
                              <span className="text-sm font-medium">0.4% (~${(numAmount * 0.004).toFixed(2)})</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-1">Est. {t('speed')}</span>
                              <span className="text-sm font-medium">~5 {t('seconds')}</span>
                            </div>
                          </div>

                          <div className="border-t border-border/50 pt-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-4">
                            {walletStatus === 'freighter' ? (
                              senderKey ? (
                                <div className="text-emerald-500 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Freighter connected</div>
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
                                disabled={(!senderKey && walletStatus === 'freighter') || isSubmitting}
                                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign & Submit'} 
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
                        <><Activity className="w-5 h-5 text-amber-500 animate-pulse" /><span className="text-amber-500 font-medium">{t('awaitingSettlement')}</span></>
                      ) : (
                        <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-emerald-500 font-medium">{t('settled')}</span></>
                      )}
                    </div>

                    {txResult && !isPolling && (
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
                          Payment Complete
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
                            <span className="text-sm text-muted-foreground">{t('savings')}</span>
                            <span className="font-bold text-lg text-amber-500">${savingsAmount.toFixed(2)} vs Bank Wire</span>
                          </div>
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
      className={`rounded-2xl transition-all duration-500 overflow-hidden ${statusColor} backdrop-blur-sm relative`}
    >
      <div className="p-5 md:p-6 flex flex-col">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : isComplete ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
            {number}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              {name}
              {isActive && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
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

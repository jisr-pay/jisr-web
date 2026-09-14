import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, ArrowRight } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { calculateTotal, formatSpeed, type Corridor } from '@/lib/corridors';

/** Marketing comparison is a separate USD example, not an XLM exchange quote. */
export const MARKETING_COMPARE_AMOUNT = 500;

interface CorridorScanTableProps {
  isScanning: boolean;
  scannedCorridors: Corridor[];
  bestCorridor: Corridor;
  savingsAmount: number;
  savingsPercent: number;
  showProceed: boolean;
  onProceed: () => void;
}

export function CorridorScanTable({
  isScanning, scannedCorridors, bestCorridor, savingsAmount, savingsPercent, showProceed, onProceed,
}: CorridorScanTableProps) {
  const { t, isRTL } = useI18nContext();

  return (
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
                      ${calculateTotal(c, MARKETING_COMPARE_AMOUNT).toFixed(2)}
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
          {showProceed && (
            <button
              onClick={onProceed}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              {t('proceedRoute')} <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

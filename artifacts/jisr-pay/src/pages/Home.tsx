import { useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useI18nContext } from '@/contexts/I18nContext';
import { AgentPipeline } from '@/components/AgentPipeline';
import { TransferHistory } from '@/components/TransferHistory';
import { Wallet, Globe, ArrowLeft } from 'lucide-react';
import { connectFreighter } from '@/lib/stellar';
import { CONTRACT_ID } from '@/lib/corridors';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { toUserMessage } from '@/lib/errors';

export default function Home() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [walletKey, setWalletKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const connectingRef = useRef(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleConnect = async () => {
    if (connectingRef.current || walletKey) return;
    connectingRef.current = true;
    setConnecting(true);
    try {
      const key = await connectFreighter();
      if (key) setWalletKey(key);
      else toast({ title: t('installFreighter'), variant: 'destructive' });
    } catch (error) {
      toast({ title: toUserMessage(error), variant: 'destructive' });
    } finally {
      connectingRef.current = false;
      setConnecting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Compact Dashboard Header */}
      <nav className="w-full px-6 py-3 flex items-center justify-between z-50 bg-background/80 backdrop-blur-md sticky top-0 border-b border-border/50">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            title={t('backToHome')}
            aria-label={t('backToHome')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">{t('home')}</span>
          </button>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18C4 18 6 8 12 8C18 8 20 18 20 18" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="4" cy="18" r="2" fill="#f59e0b"/>
              <circle cx="20" cy="18" r="2" fill="#f59e0b"/>
            </svg>
            <span className="text-base tracking-tight">
              <span className="font-extrabold text-primary">Jisr</span>
              <span className="font-medium text-foreground ms-1">Pay</span>
            </span>
          </div>
        </div>

        {/* Right: language + wallet */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary px-3 py-1.5 rounded-full"
          >
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>

          <button
            onClick={handleConnect}
            disabled={connecting || !!walletKey}
            aria-busy={connecting}
            aria-label={walletKey ?? t('connectWallet')}
            className="flex items-center gap-2 text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-full transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">
              {connecting ? t('loading') : walletKey ? `${walletKey.slice(0, 4)}...${walletKey.slice(-4)}` : t('connectWallet')}
            </span>
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="flex-1 flex flex-col w-full pt-6">
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
          <h1 className="text-2xl font-extrabold text-foreground">{t('sendPaymentTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('sendPaymentSubtitle')}
          </p>
        </div>

        <AgentPipeline walletKey={walletKey} onWalletChange={setWalletKey} />
        <TransferHistory walletKey={walletKey} />
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full border-t border-border py-5 px-6 pb-24 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {t('poweredByStellar')}
        </div>
        <div className="text-muted-foreground text-xs font-mono">
          {t('contractAddress')}: {CONTRACT_ID.slice(0, 10)}…{CONTRACT_ID.slice(-6)}
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jisr Pay.
        </div>
      </footer>
    </div>
  );
}


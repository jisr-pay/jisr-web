import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useI18nContext } from '@/contexts/I18nContext';
import { AgentPipeline } from '@/components/AgentPipeline';
import { Wallet, Globe, ArrowLeft } from 'lucide-react';
import { connectFreighter } from '@/lib/stellar';
import { CONTRACT_ID } from '@/lib/corridors';
import { useLocation } from 'wouter';

export default function Home() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [walletKey, setWalletKey] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const handleConnect = async () => {
    const key = await connectFreighter();
    if (key) setWalletKey(key);
    else alert(t('installFreighter'));
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
            title="Back to home"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">Home</span>
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
            className="flex items-center gap-2 text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-full transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">
              {walletKey ? `${walletKey.slice(0, 4)}...${walletKey.slice(-4)}` : t('connectWallet')}
            </span>
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="flex-1 flex flex-col w-full pt-6">
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
          <h1 className="text-2xl font-extrabold text-foreground">Send a Payment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-routed, blockchain-settled. Choose an amount and recipient below.
          </p>
        </div>

        <AgentPipeline walletKey={walletKey} onWalletChange={setWalletKey} />
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full border-t border-border py-5 px-6 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {t('poweredByStellar')}
        </div>
        <div className="text-muted-foreground text-xs font-mono">
          {t('contractAddress')}: {CONTRACT_ID.slice(0, 10)}…{CONTRACT_ID.slice(-6)}
        </div>
        <div className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Jisr Pay.
        </div>
      </footer>
    </div>
  );
}


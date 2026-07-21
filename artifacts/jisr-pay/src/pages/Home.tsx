import { useState } from 'react';
import { useI18nContext } from '@/contexts/I18nContext';
import { HeroScene } from '@/components/HeroScene';
import { AgentPipeline } from '@/components/AgentPipeline';
import { Wallet, Globe } from 'lucide-react';
import { connectFreighter } from '@/lib/stellar';
import { CONTRACT_ID } from '@/lib/corridors';

export default function Home() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [walletKey, setWalletKey] = useState<string | null>(null);

  const handleConnect = async () => {
    // Call connect directly — this is what makes the Freighter popup appear.
    const key = await connectFreighter();
    if (key) setWalletKey(key);
    else alert(t('installFreighter'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Nav */}
      <nav className="w-full px-6 py-4 flex items-center justify-between z-50 bg-background/80 backdrop-blur-md sticky top-0 border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* Abstract Bridge Arc Glyph */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 18C4 18 6 8 12 8C18 8 20 18 20 18" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="4" cy="18" r="2" fill="#f59e0b"/>
            <circle cx="20" cy="18" r="2" fill="#f59e0b"/>
          </svg>
          <span className="text-xl tracking-tight">
            <span className="font-extrabold text-primary">Jisr</span>
            <span className="font-medium text-foreground ms-1">Pay</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full relative">
        {/* Hero Section */}
        <section className="w-full relative">
          <HeroScene />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none pb-24">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground mb-6 drop-shadow-2xl">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed drop-shadow-md">
              {t('heroSubtitle')}
            </p>
          </div>
        </section>

        {/* Agent Pipeline Section */}
        <section className="w-full px-4 pb-24 relative z-20">
          <AgentPipeline />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 px-6 bg-[#08080c] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {t('poweredByStellar')}
        </div>
        <div className="text-muted-foreground text-xs font-mono">
          {t('contractAddress')}: {CONTRACT_ID}
        </div>
        <div className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Jisr Pay.
        </div>
      </footer>
    </div>
  );
}

import { useI18nContext } from '@/contexts/I18nContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScrollHeroSection } from '@/components/ScrollHeroSection';
import { HeroScene } from '@/components/HeroScene';
import { HowItWorks } from '@/components/HowItWorks';
import { Globe, ArrowRight, Zap, Shield, Globe2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { CORRIDORS, calculateTotal, formatSpeed } from '@/lib/corridors';
import { motion } from 'framer-motion';

const DEMO_AMOUNT = 500;

export default function Landing() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [, navigate] = useLocation();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Sticky Nav ── */}
      <nav className="w-full px-6 py-4 flex items-center justify-between z-50 bg-background/80 backdrop-blur-md sticky top-0 border-b border-border/50">
        {/* Logo */}
        <div className="flex items-center gap-2">
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: t('navFeatures'), id: 'features' },
            { label: t('navHowItWorks'), id: 'how-it-works' },
            { label: t('navCorridors'), id: 'corridors' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right controls */}
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
            id="launch-app-btn"
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)]"
          >
            {t('launchApp')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col w-full">

        {/* ── Scroll-Scrubbed 3D Particle Hero ── */}
        <ScrollHeroSection scrollHeightVh={300}>
          <div className="flex flex-col items-center justify-center text-center px-4 pointer-events-none pb-12 max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 drop-shadow-2xl"
            >
              {t('heroTitle')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed drop-shadow-md mb-8"
            >
              {t('heroSubtitle')}
            </motion.p>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onClick={() => navigate('/app')}
              className="pointer-events-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all hover:scale-105"
            >
              {t('heroCTA')} <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>
        </ScrollHeroSection>

        {/* ── Features Strip ── */}
        <section id="features" className="w-full py-20 px-6 bg-muted/40 border-y border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">{t('navFeatures')}</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-7 h-7 text-primary" />,
                  title: 'AI-Routed',
                  body: 'Three autonomous agents — Rate-Scout, Router, Reconciler — work in sequence to find the optimal path and settle on-chain in seconds.',
                },
                {
                  icon: <Shield className="w-7 h-7 text-amber-500" />,
                  title: 'Blockchain-Settled',
                  body: 'Every payment lands on the public Stellar ledger. No trusted intermediaries. No hidden fees. Independently verifiable by anyone.',
                },
                {
                  icon: <Globe2 className="w-7 h-7 text-emerald-500" />,
                  title: 'Gulf \u2194 Africa',
                  body: 'Built for real corridors: AED\u2192NGN, SAR\u2192KES, KWD\u2192GHS, QAR\u2192ETB. 0.4% flat fee vs. up to 6.5% + $15 for traditional wires.',
                },
              ].map(({ icon, title, body }) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="w-full border-b border-border/50">
          <HowItWorks />
        </section>

        {/* ── Corridors Comparison ── */}
        <section id="corridors" className="w-full py-20 px-6 bg-muted/40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">{t('navCorridors')}</h2>
            <p className="text-center text-muted-foreground mb-10">
              Sending ${DEMO_AMOUNT} \u2014 Jisr vs. the alternatives
            </p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-5 text-start font-medium">{t('provider')}</th>
                    <th className="py-3 px-5 font-medium">{t('fee')}</th>
                    <th className="py-3 px-5 font-medium">{t('speed')}</th>
                    <th className="py-3 px-5 text-end font-medium">{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRIDORS.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border/50 last:border-0 ${c.isJisr ? 'bg-primary/10' : ''}`}
                    >
                      <td className="py-4 px-5 flex items-center gap-2">
                        <span className={`font-medium ${c.isJisr ? 'text-primary' : 'text-foreground'}`}>
                          {t(c.nameKey)}
                        </span>
                        {c.isJisr && (
                          <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold uppercase">
                            Best
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center text-muted-foreground">
                        {c.feePercent}%{c.feeFixed > 0 ? ` + $${c.feeFixed}` : ''}
                      </td>
                      <td className="py-4 px-5 text-center text-muted-foreground">{formatSpeed(c.speedMinutes)}</td>
                      <td className={`py-4 px-5 text-end font-semibold ${c.isJisr ? 'text-amber-500' : ''}`}>
                        ${calculateTotal(c, DEMO_AMOUNT).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105"
              >
                {t('launchApp')} <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-border py-8 px-6 bg-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 18C4 18 6 8 12 8C18 8 20 18 20 18" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="4" cy="18" r="2" fill="#f59e0b"/>
            <circle cx="20" cy="18" r="2" fill="#f59e0b"/>
          </svg>
          <span className="font-bold text-primary">Jisr Pay</span>
          <span className="text-muted-foreground text-sm ms-2">{t('poweredByStellar')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Stellar Testnet \u2014 live
        </div>
        <div className="text-xs text-muted-foreground/60">
          \u00a9 {new Date().getFullYear()} Jisr Pay. MIT License.
        </div>
      </footer>
    </div>
  );
}

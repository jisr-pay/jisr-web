import { useRef, useState, useEffect } from 'react';
import { useI18nContext } from '@/contexts/I18nContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScrollytellingBridge } from '@/components/ScrollytellingBridge';
import { Globe, ArrowRight, Zap, Shield, Globe2, Cpu, CheckCircle2, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { CORRIDORS, calculateTotal, formatSpeed } from '@/lib/corridors';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const DEMO_AMOUNT = 500;

export default function Landing() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Bind Framer Motion scroll to container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setScrollProgress(latest);
  });

  // Smooth opacity transformations for the 5 storytelling beats
  const beat1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.22], [1, 1, 0]);
  const beat2Opacity = useTransform(scrollYProgress, [0.2, 0.32, 0.42, 0.47], [0, 1, 1, 0]);
  const beat3Opacity = useTransform(scrollYProgress, [0.45, 0.55, 0.65, 0.7], [0, 1, 1, 0]);
  const beat4Opacity = useTransform(scrollYProgress, [0.68, 0.77, 0.85, 0.89], [0, 1, 1, 0]);
  const beat5Opacity = useTransform(scrollYProgress, [0.87, 0.93, 1], [0, 1, 1]);

  const beat1Y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const beat2X = useTransform(scrollYProgress, [0.2, 0.32, 0.45], [-50, 0, -50]);
  const beat3X = useTransform(scrollYProgress, [0.45, 0.55, 0.7], [50, 0, 50]);
  const beat4Y = useTransform(scrollYProgress, [0.68, 0.77, 0.89], [50, 0, -50]);
  const beat5Y = useTransform(scrollYProgress, [0.87, 0.95], [50, 0]);

  return (
    <div
      className="min-h-screen bg-[#050505] text-foreground flex flex-col font-sans selection:bg-primary/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Apple-Style Translucent Glassmorphism Nav ── */}
      <nav className="w-full px-6 py-3.5 flex items-center justify-between z-50 bg-[#050505]/70 backdrop-blur-xl sticky top-0 border-b border-white/10 transition-all duration-300">
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

        {/* Apple-style minimalist nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Overview', id: 'hero' },
            { label: 'Rate-Scout', id: 'scrollytelling' },
            { label: 'Router', id: 'scrollytelling' },
            { label: 'Reconciler', id: 'scrollytelling' },
            { label: t('navCorridors'), id: 'corridors' },
          ].map(({ label, id }) => (
            <button
              key={label}
              onClick={() => {
                const el = document.getElementById(id);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
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
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>

          <button
            id="launch-app-btn"
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-[#00D6FF] hover:opacity-90 text-white px-5 py-2 rounded-full transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105"
          >
            {t('launchApp')}
            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </nav>

      {/* ── 350vh Apple-Style Scrollytelling Runway ── */}
      <div id="scrollytelling" ref={containerRef} className="relative h-[350vh] w-full">
        {/* Sticky Pinned Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* 3D WebGL Bridge Background */}
          <div className="absolute inset-0 z-0">
            <ScrollytellingBridge progress={scrollProgress} />
          </div>

          {/* Ambient Lighting Gradients */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-radial from-transparent via-[#050505]/40 to-[#050505]" />

          {/* ── STORY BEAT 1: Hero / Intro (0 - 18%) ── */}
          <motion.div
            style={{ opacity: beat1Opacity, y: beat1Y }}
            className="absolute z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl pointer-events-none"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-widest mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Autonomous AI Remittance Engine
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-2xl leading-none">
              Jisr<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#00D6FF] to-white">Pay</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 font-medium max-w-2xl leading-relaxed mb-8">
              Cross-border payments re-engineered. Three autonomous agents scouting, routing, and settling transactions on Stellar in seconds.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-primary to-[#00D6FF] text-white font-bold text-base px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all hover:scale-105"
            >
              Initialize Bridge Transfer <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </motion.div>

          {/* ── STORY BEAT 2: Agent 01 - Rate-Scout (18 - 42%) ── */}
          <motion.div
            style={{ opacity: beat2Opacity, x: beat2X }}
            className="absolute left-6 md:left-20 z-20 flex flex-col items-start text-start max-w-md pointer-events-none"
          >
            <div className="bg-[#0a0a0f]/90 border border-primary/30 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">
                AGENT 01 // RATE-SCOUT
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Autonomous Liquidity Scouting.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Rate-Scout continuously scans global liquidity pools across Gulf (AED, SAR, QAR, KWD) and African (NGN, KES, GHS, ETB) corridors.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> 0.4% flat fee vs up to 6.5% + $15 on bank wires
              </div>
            </div>
          </motion.div>

          {/* ── STORY BEAT 3: Agent 02 - Router (42 - 66%) ── */}
          <motion.div
            style={{ opacity: beat3Opacity, x: beat3X }}
            className="absolute right-6 md:right-20 z-20 flex flex-col items-end text-end max-w-md pointer-events-none"
          >
            <div className="bg-[#0a0a0f]/90 border border-[#00D6FF]/30 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
              <span className="text-xs font-mono font-bold text-[#00D6FF] uppercase tracking-widest block mb-2">
                AGENT 02 // ROUTER
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                On-Chain Envelope & Key Validation.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Router constructs the optimal Stellar transaction envelope, verifies public keys and trustlines, and securely requests user signature via Freighter wallet.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-[#00D6FF] bg-[#00D6FF]/10 border border-[#00D6FF]/20 p-2.5 rounded-lg">
                <Cpu className="w-4 h-4" /> Zero-knowledge key envelope construction
              </div>
            </div>
          </motion.div>

          {/* ── STORY BEAT 4: Agent 03 - Reconciler (66 - 88%) ── */}
          <motion.div
            style={{ opacity: beat4Opacity, y: beat4Y }}
            className="absolute left-6 md:left-20 z-20 flex flex-col items-start text-start max-w-md pointer-events-none"
          >
            <div className="bg-[#0a0a0f]/90 border border-emerald-500/30 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                AGENT 03 // RECONCILER
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Cryptographic Ledger Consensus.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Reconciler listens directly to the Stellar Horizon network. Once consensus locks in under 5 seconds, it generates an immutable, branded PDF receipt.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                <Lock className="w-4 h-4" /> On-chain transaction hash verification
              </div>
            </div>
          </motion.div>

          {/* ── STORY BEAT 5: Reassembly & Final CTA (88 - 100%) ── */}
          <motion.div
            style={{ opacity: beat5Opacity, y: beat5Y }}
            className="absolute z-20 flex flex-col items-center justify-center text-center px-4 max-w-3xl pointer-events-none"
          >
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
              Hear Everything. Pay Nothing Extra.
            </h2>
            <p className="text-lg text-white/70 font-medium mb-8">
              Experience instant, zero-markup cross-border payments powered by autonomous agents on Stellar.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-primary to-[#00D6FF] text-white font-bold text-lg px-9 py-4 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all hover:scale-105"
            >
              Launch Jisr App Now <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </motion.div>

        </div>
      </div>

      {/* ── Corridors Comparison Table ── */}
      <section id="corridors" className="w-full py-24 px-6 bg-[#08080c] border-t border-white/10 z-30 relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-center text-white mb-3">{t('navCorridors')}</h2>
          <p className="text-center text-white/60 mb-12">
            Sending ${DEMO_AMOUNT} — Jisr-Pay vs. Traditional Money Transmitters
          </p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-4 px-6 text-start font-semibold">{t('provider')}</th>
                  <th className="py-4 px-6 font-semibold text-center">{t('fee')}</th>
                  <th className="py-4 px-6 font-semibold text-center">{t('speed')}</th>
                  <th className="py-4 px-6 text-end font-semibold">{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {CORRIDORS.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border/50 last:border-0 ${c.isJisr ? 'bg-primary/10' : ''}`}
                  >
                    <td className="py-4 px-6 flex items-center gap-2">
                      <span className={`font-semibold ${c.isJisr ? 'text-primary' : 'text-foreground'}`}>
                        {t(c.nameKey)}
                      </span>
                      {c.isJisr && (
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                          Optimal Route
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-muted-foreground">
                      {c.feePercent}%{c.feeFixed > 0 ? ` + $${c.feeFixed}` : ''}
                    </td>
                    <td className="py-4 px-6 text-center text-muted-foreground">{formatSpeed(c.speedMinutes)}</td>
                    <td className={`py-4 px-6 text-end font-bold ${c.isJisr ? 'text-amber-400 text-base' : ''}`}>
                      ${calculateTotal(c, DEMO_AMOUNT).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105"
            >
              {t('launchApp')} <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-white/10 py-8 px-6 bg-[#050505] flex flex-col md:flex-row items-center justify-between gap-4 z-30 relative">
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
          Stellar Testnet — live
        </div>
        <div className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Jisr Pay. MIT License.
        </div>
      </footer>
    </div>
  );
}

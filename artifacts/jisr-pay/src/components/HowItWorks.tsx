import { motion } from 'framer-motion';
import { Search, Route, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';

export function HowItWorks() {
  const { t } = useI18nContext();

  const steps = [
    {
      icon: Search,
      num: '01',
      title: t('hiwStep1Title'),
      body: t('hiwStep1Body'),
      accent: 'text-amber-500',
      ring: 'group-hover:border-amber-500/40',
    },
    {
      icon: Route,
      num: '02',
      title: t('hiwStep2Title'),
      body: t('hiwStep2Body'),
      accent: 'text-primary',
      ring: 'group-hover:border-primary/40',
    },
    {
      icon: CheckCircle2,
      num: '03',
      title: t('hiwStep3Title'),
      body: t('hiwStep3Body'),
      accent: 'text-emerald-500',
      ring: 'group-hover:border-emerald-500/40',
    },
  ];

  const stats = [
    { value: '0.4%', label: t('statFeeLabel') },
    { value: `~5 ${t('seconds')}`, label: t('statSpeedLabel') },
    { value: t('statVerifyValue'), label: t('statVerifyLabel') },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-20 md:py-28">
      {/* Heading */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground"
        >
          {t('hiwTitle')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {t('hiwSubtitle')}
        </motion.p>
      </div>

      {/* Agent steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`group relative rounded-2xl border border-border bg-gradient-to-b from-card/80 to-[#0d0d13] p-7 backdrop-blur-sm transition-colors ${s.ring} overflow-hidden`}
            >
              {/* metallic sheen */}
              <div className="pointer-events-none absolute -top-24 -end-24 h-48 w-48 rounded-full bg-white/[0.04] blur-2xl" />
              <div className="flex items-center justify-between mb-5">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black/40 border border-white/5 ${s.accent}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-mono text-4xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                  {s.num}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-[#0d0d13] p-8"
      >
        {stats.map((st) => (
          <div key={st.label} className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-foreground">{st.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{st.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Why Stellar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 flex flex-col md:flex-row items-start gap-5 rounded-2xl border border-border bg-card/60 p-8"
      >
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t('whyTitle')}</h3>
          <p className="text-sm md:text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t('whyBody')}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useI18n, Lang, StringKey } from '@/lib/i18n';

interface I18nContextValue {
  lang: Lang;
  t: (key: StringKey) => string;
  toggleLang: () => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const i18n = useI18n();
  useEffect(() => {
    document.documentElement.dir = i18n.isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.lang;
  }, [i18n.isRTL, i18n.lang]);
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18nContext must be inside I18nProvider');
  return ctx;
}

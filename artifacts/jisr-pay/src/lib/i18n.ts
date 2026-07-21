import { useState } from 'react';

export type Lang = 'en' | 'ar';

export const strings = {
  en: {
    // Nav
    appName: 'Jisr Pay',
    connectWallet: 'Connect Wallet',
    walletConnected: 'Wallet Connected',
    // Hero
    heroTitle: 'Bridge Money Across Borders',
    heroSubtitle: 'Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled, fraction of the cost',
    heroCTA: 'Find the Best Route',
    // Agent Labels
    agent1Name: 'Rate-Scout',
    agent1Desc: 'Comparing all corridors to find the best route',
    agent2Name: 'Router',
    agent2Desc: 'Resolving recipient and building Stellar transaction',
    agent3Name: 'Reconciler',
    agent3Desc: 'Polling Stellar Testnet for final settlement',
    // Send Form
    sendAmount: 'You Send',
    recipientAddress: 'Recipient Address or Federation ID',
    recipientPlaceholder: 'alice*jisr.pay or GXXXXXXX...',
    currency: 'Currency',
    selectCurrency: 'Select currency',
    // Corridor table headers
    provider: 'Provider',
    fee: 'Fee',
    speed: 'Speed',
    method: 'Method',
    total: 'Total Cost',
    // Providers
    bankWire: 'Bank Wire',
    cashPickup: 'Cash Pickup (Western Union)',
    mobileMoney: 'Mobile Money (M-Pesa)',
    jisrStellar: 'Jisr (Stellar)',
    // Status messages
    scanning: 'Scanning corridors...',
    bestRoute: 'Best route identified',
    resolvingFederation: 'Resolving federation address...',
    buildingTx: 'Building Soroban transaction...',
    submittingTx: 'Submitting to Stellar Testnet...',
    awaitingSettlement: 'Awaiting settlement...',
    settled: 'Payment settled!',
    txHash: 'Transaction Hash',
    feePaid: 'Fee Paid',
    settlementTime: 'Settlement Time',
    savings: 'You saved vs. traditional',
    // Errors
    installFreighter: 'Please install the Freighter wallet extension',
    freighterMobile: 'Freighter not available on mobile — tap to open web version',
    txFailed: 'Transaction failed',
    // General
    send: 'Send',
    seconds: 'seconds',
    xlm: 'XLM',
    usd: 'USD',
    aed: 'AED',
    kes: 'KES',
    ngn: 'NGN',
    loading: 'Loading...',
    step: 'Step',
    of: 'of',
    viewOnStellar: 'View on Stellar Expert',
    poweredByStellar: 'Powered by Stellar Testnet',
    contractAddress: 'Contract',
    fees: 'fees',
    faster: 'faster',
    // Payment complete actions
    sendAnother: 'Send Another Payment',
    viewHistory: 'View Your History',
    // How it works
    hiwTitle: 'How It Works',
    hiwSubtitle: 'Three AI agents turn a cross-border payment into a five-second, on-chain settlement.',
    hiwStep1Title: 'Rate-Scout',
    hiwStep1Body: 'Scans every corridor — bank wire, cash pickup, mobile money and Stellar — and finds the cheapest, fastest route in real time.',
    hiwStep2Title: 'Router',
    hiwStep2Body: 'Resolves the recipient (a Stellar address or a *jisr.pay federation name) and builds a Soroban smart-contract transaction on the deployed payment router.',
    hiwStep3Title: 'Reconciler',
    hiwStep3Body: 'Submits to Stellar, polls the network, and confirms real on-chain settlement — returning a transaction hash you can verify yourself.',
    statFeeLabel: 'network fee',
    statSpeedLabel: 'to settle',
    statVerifyValue: 'On-chain',
    statVerifyLabel: 'and verifiable',
    whyTitle: 'Why Stellar?',
    whyBody: 'Every payment settles on the public Stellar network in seconds for a fraction of a cent — no correspondent banks, no multi-day delays. Jisr Pay uses a live, deployed Soroban contract, so every settlement is real and independently verifiable on the block explorer.',
  },
  ar: {
    // Nav
    appName: 'جسر باي',
    connectWallet: 'ربط المحفظة',
    walletConnected: 'المحفظة متصلة',
    // Hero
    heroTitle: 'جسر الأموال عبر الحدود',
    heroSubtitle: 'تحويلات الخليج ↔ أفريقيا بسرعة ستيلار — توجيه بالذكاء الاصطناعي، تسوية على البلوكتشين، بجزء من التكلفة',
    heroCTA: 'ابحث عن أفضل طريق',
    // Agent Labels
    agent1Name: 'استطلاع الأسعار',
    agent1Desc: 'مقارنة جميع الممرات لإيجاد أفضل طريق',
    agent2Name: 'الموجّه',
    agent2Desc: 'تحديد المستلم وبناء معاملة ستيلار',
    agent3Name: 'المطابق',
    agent3Desc: 'مراقبة شبكة ستيلار للتسوية النهائية',
    // Send Form
    sendAmount: 'المبلغ المرسل',
    recipientAddress: 'عنوان المستلم أو معرف الاتحاد',
    recipientPlaceholder: 'alice*jisr.pay أو GXXXXXXX...',
    currency: 'العملة',
    selectCurrency: 'اختر عملة',
    // Corridor table headers
    provider: 'المزود',
    fee: 'الرسوم',
    speed: 'السرعة',
    method: 'الطريقة',
    total: 'التكلفة الإجمالية',
    // Providers
    bankWire: 'تحويل بنكي',
    cashPickup: 'استلام نقدي (ويسترن يونيون)',
    mobileMoney: 'موبايل موني (M-Pesa)',
    jisrStellar: 'جسر (ستيلار)',
    // Status messages
    scanning: 'جاري مسح الممرات...',
    bestRoute: 'تم تحديد أفضل طريق',
    resolvingFederation: 'جاري تحليل عنوان الاتحاد...',
    buildingTx: 'بناء معاملة سوروبان...',
    submittingTx: 'إرسال إلى شبكة ستيلار الاختبارية...',
    awaitingSettlement: 'في انتظار التسوية...',
    settled: 'تمت التسوية!',
    txHash: 'رمز المعاملة',
    feePaid: 'الرسوم المدفوعة',
    settlementTime: 'وقت التسوية',
    savings: 'وفرت مقارنة بالتقليدي',
    // Errors
    installFreighter: 'الرجاء تثبيت إضافة محفظة Freighter',
    freighterMobile: 'Freighter غير متوفر على الجوال — انقر لفتح النسخة الإلكترونية',
    txFailed: 'فشلت المعاملة',
    // General
    send: 'إرسال',
    seconds: 'ثوانٍ',
    xlm: 'XLM',
    usd: 'دولار',
    aed: 'درهم',
    kes: 'شلن كيني',
    ngn: 'نيرة نيجيرية',
    loading: 'جاري التحميل...',
    step: 'الخطوة',
    of: 'من',
    viewOnStellar: 'عرض على Stellar Expert',
    poweredByStellar: 'مدعوم بشبكة ستيلار الاختبارية',
    contractAddress: 'العقد',
    fees: 'رسوم',
    faster: 'أسرع',
    // Payment complete actions
    sendAnother: 'إرسال دفعة أخرى',
    viewHistory: 'عرض سجلك',
    // How it works
    hiwTitle: 'كيف يعمل',
    hiwSubtitle: 'ثلاثة وكلاء بالذكاء الاصطناعي يحوّلون التحويل عبر الحدود إلى تسوية على البلوكتشين خلال خمس ثوانٍ.',
    hiwStep1Title: 'استطلاع الأسعار',
    hiwStep1Body: 'يمسح كل ممر — تحويل بنكي، استلام نقدي، موبايل موني وستيلار — ويجد أرخص وأسرع طريق في الوقت الفعلي.',
    hiwStep2Title: 'الموجّه',
    hiwStep2Body: 'يحدد المستلم (عنوان ستيلار أو اسم اتحاد ‎*jisr.pay‎) ويبني معاملة عقد ذكي على موجّه الدفع المنشور عبر سوروبان.',
    hiwStep3Title: 'المطابق',
    hiwStep3Body: 'يرسل إلى ستيلار، يراقب الشبكة، ويؤكد التسوية الفعلية على البلوكتشين — مع إرجاع رمز معاملة يمكنك التحقق منه بنفسك.',
    statFeeLabel: 'رسوم الشبكة',
    statSpeedLabel: 'للتسوية',
    statVerifyValue: 'على البلوكتشين',
    statVerifyLabel: 'وقابل للتحقق',
    whyTitle: 'لماذا ستيلار؟',
    whyBody: 'كل دفعة تتم تسويتها على شبكة ستيلار العامة خلال ثوانٍ وبجزء بسيط من السنت — بدون بنوك مراسلة، وبدون تأخير لأيام. يستخدم جسر باي عقد سوروبان منشوراً وحياً، لذا كل تسوية حقيقية وقابلة للتحقق بشكل مستقل على مستكشف البلوكتشين.',
  },
} as const;

export type StringKey = keyof typeof strings.en;

export function useI18n() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('jisr-lang') as Lang) || 'en';
  });
  const t = (key: StringKey): string => strings[lang][key] ?? strings.en[key];
  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    localStorage.setItem('jisr-lang', next);
    setLang(next);
  };
  const isRTL = lang === 'ar';
  return { lang, t, toggleLang, isRTL };
}

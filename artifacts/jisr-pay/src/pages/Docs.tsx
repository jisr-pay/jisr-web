import type { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useI18nContext } from '@/contexts/I18nContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Home,
  BookOpen,
  GitBranch,
  Boxes,
  Layers,
  Database,
  ShieldCheck,
  Rocket,
  Code2,
  Globe,
  ExternalLink,
} from 'lucide-react';

type Bi = { en: string; ar: string };

const repos: { name: string; link: string; owner: Bi; purpose: Bi; status: Bi }[] = [
  {
    name: 'jisr-web',
    link: 'https://github.com/jisr-pay/jisr-web',
    owner: { en: 'EthTobi / Freebuff', ar: 'EthTobi / Freebuff' },
    purpose: {
      en: 'Web app: UI, Freighter wallet integration, receipts, corridor product copy.',
      ar: 'التطبيق الإلكتروني: واجهة المستخدم، ربط محفظة Freighter، الإيصالات، ومحتوى المنتج للممرات.',
    },
    status: { en: 'Active', ar: 'نشط' },
  },
  {
    name: 'jisr-sdk',
    link: 'https://github.com/jisr-pay/jisr-sdk',
    owner: { en: 'EthTobi / Freebuff', ar: 'EthTobi / Freebuff' },
    purpose: {
      en: 'Standalone published package of payment primitives; interface frozen after extraction.',
      ar: 'حزمة منشورة مستقلة من بدائيات الدفع؛ الواجهة مجمّدة بعد الاستخراج.',
    },
    status: { en: 'Published', ar: 'منشور' },
  },
  {
    name: 'jisr-api',
    link: 'https://github.com/jisr-pay/jisr-api',
    owner: { en: 'OTimileyin / Codex', ar: 'OTimileyin / Codex' },
    purpose: {
      en: 'Internal Node HTTP Testnet API: durable transfer tracking and a read-only reconciliation boundary.',
      ar: 'واجهة برمجة Node HTTP داخلية لشبكة الاختبار: تتبّع دائم للتحويلات وحدود مطابقة للقراءة فقط.',
    },
    status: { en: 'In development', ar: 'قيد التطوير' },
  },
  {
    name: 'jisr-routing',
    link: 'https://github.com/jisr-pay/jisr-routing',
    owner: { en: 'OTimileyin / Codex', ar: 'OTimileyin / Codex' },
    purpose: {
      en: 'Provider interface and exact indicative quote comparison. No live providers yet.',
      ar: 'واجهة المزود ومقارنة دقيقة للأسعار الاسترشادية. لا مزودات حية بعد.',
    },
    status: { en: 'In development', ar: 'قيد التطوير' },
  },
  {
    name: 'payment-router-contract',
    link: 'https://github.com/jisr-pay/payment-router-contract',
    owner: { en: 'Source holder (TBD)', ar: 'حامل المصدر (يُحدد لاحقاً)' },
    purpose: {
      en: 'Read-only Testnet deployment inspection and original-source recovery workspace.',
      ar: 'مساحة فحص قراءة فقط لنشر شبكة الاختبار واسترجاع المصدر الأصلي.',
    },
    status: { en: 'Draft PR; source pending', ar: 'PR مسودة؛ المصدر قيد الانتظار' },
  },
];

const endpoints: { method: string; path: string; auth: boolean; summary: Bi; kind: string }[] = [
  {
    method: 'GET',
    path: '/healthz',
    auth: false,
    summary: {
      en: 'Database availability; does not claim live network readiness.',
      ar: 'توافر قاعدة البيانات؛ لا يدّعي جاهزية الشبكة المباشرة.',
    },
    kind: 'public',
  },
  {
    method: 'POST',
    path: '/v1/transfers',
    auth: true,
    summary: {
      en: 'Register an immutable pending transfer. 201 new, 200 identical retry, 409 conflicting identity.',
      ar: 'تسجيل تحويل معلّق غير قابل للتغيير. 201 جديد، 200 إعادة مماثلة، 409 تعارض في الهوية.',
    },
    kind: 'auth',
  },
  {
    method: 'GET',
    path: '/v1/transfers/:hash',
    auth: true,
    summary: {
      en: 'Read one registered transfer.',
      ar: 'قراءة تحويل مسجّل واحد.',
    },
    kind: 'auth',
  },
  {
    method: 'POST',
    path: '/v1/transfers/:hash/reconcile',
    auth: true,
    summary: {
      en: 'Run the trusted network adapter. 503 until that adapter exists.',
      ar: 'تشغيل مُكيِّف الشبكة الموثوق. 503 حتى وجود هذا المُكيّف.',
    },
    kind: 'auth',
  },
];

const registrationFields: { field: string; rule: Bi }[] = [
  { field: 'hash', rule: { en: 'Hexadecimal transaction hash, exactly 64 lower-case characters.', ar: 'رمز معاملة سداسي عشري بطول 64 حرفاً بأحرف صغيرة.' } },
  { field: 'network', rule: { en: 'Must be TESTNET.', ar: 'يجب أن يكون TESTNET.' } },
  { field: 'asset', rule: { en: 'Must be XLM.', ar: 'يجب أن يكون XLM.' } },
  { field: 'sender / recipient', rule: { en: 'Stellar address shape G… (checksum validation pending).', ar: 'شكل عنوان ستيلار G… (التحقق من المجموع الاختباري قيد التنفيذ).' } },
  { field: 'amount', rule: { en: 'Decimal string, ≤ 7 fractional digits, > 0, max 90,000,000,000 XLM.', ar: 'سلسلة عشرية، حتى 7 منازل عشرية، أكبر من صفر، بحد أقصى 90,000,000,000 XLM.' } },
  { field: 'contractId', rule: { en: 'Stellar contract shape C…', ar: 'شكل عقد ستيلار C…' } },
  { field: 'submittedAt', rule: { en: 'Canonical UTC with milliseconds; at most five minutes in the future.', ar: 'UTC أساسية بالمللي ثانية؛ وبحد أقصى خمس دقائق في المستقبل.' } },
];

const outcomes: string[] = [
  'pending',
  'confirmed',
  'failed',
  'unknown',
  'unavailable',
  'invalid_evidence',
  'unverified_payment',
];

const sdk: { group: Bi; items: { name: string; note: Bi }[] }[] = [
  {
    group: { en: 'Amounts', ar: 'المبالغ' },
    items: [
      {
        name: 'parseAmountToStroops(amount)',
        note: {
          en: 'Exact decimal to stroops, never floats; caps at 90B XLM.',
          ar: 'تحويل عشري دقيق إلى ستروبات دون أرقام عشرية متحركة؛ بسقف 90B XLM.',
        },
      },
    ],
  },
  {
    group: { en: 'Errors', ar: 'الأخطاء' },
    items: [
      {
        name: 'AppError, classifyError, isUserRejection, toUserMessage',
        note: { en: 'Typed error taxonomy and user-facing message mapping.', ar: 'تصنيف أخطاء مكتوبة وربط رسائل موجهة للمستخدم.' },
      },
    ],
  },
  {
    group: { en: 'Network', ar: 'الشبكة' },
    items: [
      {
        name: 'resolveNetworkConfig(env), NetworkConfig',
        note: {
          en: 'Validated Testnet configuration; the SDK never reads environment itself.',
          ar: 'إعدادات Testnet مُتحقق منها؛ الحزمة لا تقرأ البيئة بنفسها.',
        },
      },
    ],
  },
  {
    group: { en: 'Settlement', ar: 'التسوية' },
    items: [
      {
        name: 'fetchSettlement(horizonUrl, hash, fetcher?)',
        note: {
          en: 'Read-only network lookup returning TransferSettlement or null. The only settlement evidence.',
          ar: 'بحث شبكة للقراءة فقط يعيد TransferSettlement أو null. وهو دليل التسوية الوحيد.',
        },
      },
    ],
  },
  {
    group: { en: 'Journal', ar: 'السجل' },
    items: [
      {
        name: 'applySettlement, readTransfers, saveTransfer, HISTORY_KEY, isSavedTransfer, settlementDurationMs',
        note: {
          en: 'Transfer journal over an injected HistoryStorage port; never browser storage.',
          ar: 'سجل التحويلات عبر منفذ HistoryStorage محقون؛ لا يستخدم تخزين المتصفح أبداً.',
        },
      },
    ],
  },
  {
    group: { en: 'Rate limiting', ar: 'تحديد المعدل' },
    items: [
      { name: 'enforce, record, retryAfter, RULES, setClock', note: { en: 'Server-side rate limiting primitives.', ar: 'بدائيات تحديد معدل من جانب الخادم.' } },
    ],
  },
  {
    group: { en: 'Logging', ar: 'التسجيل' },
    items: [
      { name: 'createLogger, setLogSink', note: { en: 'Injectable logging with no console dependency.', ar: 'تسجيل قابل للحقن دون اعتماد على console.' } },
    ],
  },
  {
    group: { en: 'Payment (wallet only)', ar: 'الدفع (للمحفظة فقط)' },
    items: [
      {
        name: 'buildAndSubmitPayment, PaymentWallet, withRetry',
        note: {
          en: 'Signing/broadcasting stays in the wallet flow; never import into the backend.',
          ar: 'التوقيع والإرسال يبقيان في تدفق المحفظة؛ لا يُستوردان في الواجهة الخلفية أبداً.',
        },
      },
    ],
  },
];

const flowSteps: { title: Bi; body: Bi }[] = [
  {
    title: { en: 'Enter the transfer', ar: 'أدخل التحويل' },
    body: {
      en: 'Choose an amount and a recipient — a Stellar address or a federation name like alice*jisr.pay.',
      ar: 'اختر المبلغ والمستلم — عنوان ستيلار أو اسم اتحاد مثل alice*jisr.pay.',
    },
  },
  {
    title: { en: 'Rate-Scout compares corridors', ar: 'استطلاع الأسعار يقارن الممرات' },
    body: {
      en: 'Shows illustrative cost/speed comparisons across bank wire, cash pickup, mobile money and Stellar. These are not live quotes.',
      ar: 'يعرض مقارنات توضيحية للتكلفة والسرعة عبر التحويل البنكي والاستلام النقدي وموبايل موني وستيلار. هذه ليست أسعاراً حية.',
    },
  },
  {
    title: { en: 'Router builds the transaction', ar: 'الموجّه يبني المعاملة' },
    body: {
      en: 'Resolves the recipient and builds a Soroban transaction calling route_payment on the deployed router contract.',
      ar: 'يحدد المستلم ويبني معاملة سوروبان تستدعي route_payment على عقد الموجّه المنشور.',
    },
  },
  {
    title: { en: 'Sign and settle', ar: 'وقّع وسوّي' },
    body: {
      en: 'You review and sign in Freighter. Reconciler submits to Stellar Testnet and polls until settlement.',
      ar: 'تراجع وتوقّع في Freighter. يُرسل المطابق إلى شبكة ستيلار الاختبارية ويستقصي حتى التسوية.',
    },
  },
  {
    title: { en: 'Receipt and history', ar: 'الإيصال والسجل' },
    body: {
      en: 'A receipt captures the transaction hash; history is saved locally. No private keys are stored.',
      ar: 'يلتقط الإيصال رمز المعاملة؛ ويُحفظ السجل محلياً. لا تُخزَّن مفاتيح خاصة.',
    },
  },
];

const contract: { label: Bi; value: string }[] = [
  { label: { en: 'Network / passphrase', ar: 'الشبكة / عبارة المرور' }, value: 'TESTNET — Test SDF Network ; September 2015' },
  { label: { en: 'Router contract', ar: 'عقد الموجّه' }, value: 'CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER' },
  { label: { en: 'Token address', ar: 'عنوان العملة' }, value: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' },
  { label: { en: 'Platform treasury', ar: 'خزينة المنصة' }, value: 'GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST' },
  { label: { en: 'RPC', ar: 'RPC' }, value: 'https://soroban-testnet.stellar.org' },
  {
    label: { en: 'Observed entry (WASM)', ar: 'الواجهة المرصودة (WASM)' },
    value: 'route_payment(sender, recipient, platform_treasury, token_address, amount: i128)',
  },
  {
    label: { en: 'Deployed WASM SHA-256', ar: 'مجمّع WASM المنشور SHA-256' },
    value: 'ab6715d3611c45b0e2c7764e496635e28f141adb245392ac74bb80325c7164c2 (3401 bytes)',
  },
];

const commands: { what: Bi; run: string }[] = [
  {
    what: { en: 'Web + SDK tests (pnpm workspace)', ar: 'اختبارات الويب + SDK (مساحة عمل pnpm)' },
    run: 'corepack pnpm -r --if-present run test',
  },
  {
    what: { en: 'Workspace typecheck', ar: 'التحقق من الأنواع لمساحة العمل' },
    run: 'node node_modules/typescript/bin/tsc --build',
  },
  {
    what: { en: 'Web production build', ar: 'بناء الإنتاج للويب' },
    run: 'corepack pnpm --filter @workspace/jisr-pay run build',
  },
  {
    what: { en: 'Internal API (jisr-api clone)', ar: 'الواجهة الداخلية (نسخة jisr-api)' },
    run: 'npm ci && npm test && npm run build && npm start',
  },
  {
    what: { en: 'Contract inspector (payment-router-contract)', ar: 'مُدقِّق العقد (payment-router-contract)' },
    run: 'npm ci && npm run build && npm run inspect',
  },
];

const roadmap: { title: Bi; items: Bi[] }[] = [
  {
    title: { en: 'Done', ar: 'مكتمل' },
    items: [
      {
        en: 'Self-funded repo split under github.com/jisr-pay; web rename to jisr-web.',
        ar: 'فصل المستودعات الذاتي تحت github.com/jisr-pay؛ وإعادة تسمية الويب إلى jisr-web.',
      },
      {
        en: 'SDK extraction and standalone publication; backend-consumed interface frozen.',
        ar: 'استخراج SDK ونشره كحزمة مستقلة؛ وتجميد الواجهة المستهلكة من الواجهة الخلفية.',
      },
      {
        en: 'Organization ownership confirmed; branch protection enforcing on published repos.',
        ar: 'تأكيد ملكية المنظمة؛ وحماية الفروع مفعّلة على المستودعات المنشورة.',
      },
    ],
  },
  {
    title: { en: 'In progress / next', ar: 'قيد الإنجاز / التالي' },
    items: [
      {
        en: 'SDK compiled JavaScript + declaration exports so installed Node imports work.',
        ar: 'مخرجات JavaScript مجمّعة وإعلانات أنواع من SDK حتى تعمل الاستيرادات المثبتة في Node.',
      },
      {
        en: 'SDK address-checksum validator and caller-signal cancellation support.',
        ar: 'مُتحقق المجموع الاختباري للعناوين ودعم إلغاء إشارات المستدعي في SDK.',
      },
      {
        en: 'Original payment_router Rust source and reproducible build evidence.',
        ar: 'مصدر Rust الأصلي لعقد payment_router ودليل بناء قابل للتكرار.',
      },
      {
        en: 'Live reconciliation evidence adapter and wallet-ownership verification for the API.',
        ar: 'مُكيِّف أدلة مطابقة حي وواجهة التحقق من ملكية المحفظة للواجهة البرمجية.',
      },
      {
        en: 'Interface review sign-off and first backend milestone (tracked in issue #18).',
        ar: 'اعتماد مراجعة الواجهة والمرحلة الخلفية الأولى (متابعة في القضية رقم 18).',
      },
      {
        en: 'Draft pull requests for the API and routing repositories as their work lands.',
        ar: 'PR مسودات لمستودعي الواجهة والتوجيه مع نزول أعمالهما.',
      },
    ],
  },
  {
    title: { en: 'Not started', ar: 'لم يبدأ' },
    items: [
      {
        en: 'Real routing provider integrations; Postgres/Express alignment for production.',
        ar: 'تكاملات مزودات التوجيه الحقيقية؛ ومواءمة Postgres/Express للإنتاج.',
      },
    ],
  },
];

const securityItems: Bi[] = [
  {
    en: 'Testnet only: test XLM, no currency conversion or payout.',
    ar: 'شبكة الاختبار فقط: XLM تجريبي دون تحويل عملات أو صرف.',
  },
  {
    en: 'The API stores no private keys and no signed transaction payloads; no backend signing or automatic rebroadcast.',
    ar: 'الواجهة لا تخزّن مفاتيح خاصة أو حمولات معاملات موقعة؛ لا توقيع من الواجهة الخلفية ولا إعادة بث تلقائية.',
  },
  {
    en: 'The service token is a server-side credential and is never a wallet login.',
    ar: 'رمز الخدمة هو وصيف من جانب الخادم وليس تسجيل دخول محفظة أبداً.',
  },
  {
    en: 'Address validation is shape-only pending SDK checksums; amounts stay exact integer stroops.',
    ar: 'التحقق من العناوين يقتصر على الشكل بانتظار المجاميع الاختبارية لـ SDK؛ والمبالغ تبقى ستروبات صحيحة دقيقة.',
  },
  {
    en: 'Wallet ownership must be verified before any private history or owner-scoped mutation; a supplied address is not authentication.',
    ar: 'يجب التحقق من ملكية المحفظة قبل أي سجل خاص أو تعديل مرتبط بالمالك؛ العنوان المقدم ليس مصادقة.',
  },
  {
    en: 'Client-supplied status is never settlement evidence; only a trusted network lookup can change stored state.',
    ar: 'الحالة المقدمة من العميل ليست دليل تسوية أبداً؛ فقط بحث الشبكة الموثوق يغيّر الحالة المخزنة.',
  },
];

const links: { name: string; url: string; note: Bi }[] = [
  { name: 'jisr-web', url: 'https://github.com/jisr-pay/jisr-web', note: { en: 'This web app', ar: 'هذا التطبيق الإلكتروني' } },
  { name: 'jisr-sdk', url: 'https://github.com/jisr-pay/jisr-sdk', note: { en: 'Published SDK package', ar: 'حزمة SDK المنشورة' } },
  { name: 'jisr-api', url: 'https://github.com/jisr-pay/jisr-api', note: { en: 'Internal Testnet API', ar: 'واجهة Testnet الداخلية' } },
  { name: 'jisr-routing', url: 'https://github.com/jisr-pay/jisr-routing', note: { en: 'Quote provider interface', ar: 'واجهة مزود الأسعار' } },
  { name: 'payment-router-contract', url: 'https://github.com/jisr-pay/payment-router-contract', note: { en: 'Deployment inspection (draft PR #1)', ar: 'فحص النشر (PR مسودة #1)' } },
];

const text = {
  en: {
    title: 'Technical Documentation',
    subtitle:
      'How Jisr Pay is built, published and verified — repositories, architecture, interfaces, deployment evidence and open work items.',
    updated: 'Last updated',
    tocTitle: 'On this page',
    linkTo: 'Open repository',
    overview: 'Overview',
    overviewBody:
      'Jisr Pay is a cross-border remittance showcase for Gulf ↔ Africa corridors that routes and settles payments on the Stellar Testnet. Three cooperating agents — Rate-Scout (finds the cheapest and fastest corridor), Router (resolves the recipient and builds a Soroban transaction on the deployed payment router) and Reconciler (polls the network and confirms settlement) — take a transfer from form to receipt. This page documents the current architecture, the frozen SDK interface, the internal API contract and the evidence status of the deployed contract.',
    repos: 'Repositories & ownership',
    reposIntro:
      'The code is split across separate repositories under github.com/jisr-pay. The web app and SDK form the shipped product; the API, routing and contract repositories are the backend foundation under active development.',
    repoCol: 'Repository',
    ownerCol: 'Owner',
    purposeCol: 'Purpose',
    statusCol: 'Status',
    architecture: 'Architecture',
    architectureIntro:
      'The web app consumes the SDK as a workspace package and the standalone published package; wallet code stays in the app. The internal API is a separate dependency-free Node service that tracks transfers and runs read-only reconciliation. Quote collection is an isolated interface package. Contract provenance is tracked separately.',
    archPrism: 'UI, wallet adapter, receipts, corridor data stay in jisr-web',
    archSdk: 'Frozen payment primitives consumed by web and backend',
    archApi: 'Durable tracking + reconciliation boundary (service token)',
    archRouting: 'Provider interface; no live providers yet',
    archContract: 'Deployed bytecode inspection; source recovery pending',
    paymentFlow: 'Payment flow',
    flowStep: 'Step',
    sdk: 'SDK interface (frozen)',
    sdkIntro:
      'The backend-consumed interface was frozen at extraction and is imported from the barrel only. Types: TransferSettlement, SavedTransfer, TransferStatus, HistoryStorage, NetworkConfig, TransactionResult.',
    sdkNote:
      'Packaging note: the package currently ships source-only TypeScript exports. Installed Node consumers still hit ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING until compiled JavaScript and declarations are published.',
    api: 'Internal API',
    apiIntro:
      'Service-only foundation on Node 24 + SQLite. All routes except health require Authorization: Bearer <SERVICE_TOKEN>. Amounts cross the wire as decimal strings; values are exact stroops internally.',
    apiNoAuth: 'public',
    apiAuth: 'token',
    regFields: 'Registration fields',
    reconcileTitle: 'Reconciliation outcomes',
    reconcileBody:
      'Only an adapter that verifies the Testnet network, contract invocation, token, sender, recipient and amount from operation/event evidence may return paymentVerified. A transaction success flag alone is insufficient; missing transactions and transient errors keep records pending or unknown.',
    contract: 'Router contract & evidence',
    contractIntro:
      'The client defaults reference a deployed Testnet router contract. Ledger bytecode was fetched and hashed; this documents observed behavior, not original source. Reconstructed code must never be presented as the deployed original.',
    dev: 'Development',
    devIntro: 'Reproduction commands across the workspace and the three backend clones.',
    roadmap: 'Roadmap & status',
    security: 'Security & limits',
    linksTitle: 'Source & docs',
    pkgNote: 'Packaging',
    addrNote: 'Checksum validation pending',
    sanityNote: 'No new keys or signed payloads are stored',
  },
  ar: {
    title: 'التوثيق التقني',
    subtitle:
      'كيف يُبنى جسر باي ويُنشر ويُتحقق منه — المستودعات، البنية، الواجهات، أدلة النشر، وبنود العمل المفتوحة.',
    updated: 'آخر تحديث',
    tocTitle: 'في هذه الصفحة',
    linkTo: 'فتح المستودع',
    overview: 'نظرة عامة',
    overviewBody:
      'جسر باي هو عرض لتحويل الأموال عبر الحدود لممرات الخليج ↔ أفريقيا، يوجّه الدفعات ويسوّيها على شبكة ستيلار الاختبارية. ثلاثة وكلاء متعاونون — استطلاع الأسعار (يجد أرخص وأسرع طريق)، الموجّه (يحدد المستلم ويبني معاملة سوروبان على عقد الموجّه المنشور)، والمطابق (يراقب الشبكة ويؤكد التسوية) — ينقلون التحويل من النموذج إلى الإيصال. توثّق هذه الصفحة البنية الحالية، وواجهة SDK المجمّدة، وعقد الواجهة البرمجية الداخلية، وحالة أدلة العقد المنشور.',
    repos: 'المستودعات والملكية',
    reposIntro:
      'الكود موزّع على مستودعات منفصلة تحت github.com/jisr-pay. يشكّل التطبيق الإلكتروني وSDK المنتَج المنشور؛ أما مستودعات الواجهة، والتوجيه، والعقد فهي الأساس الخلفي قيد التطوير.',
    repoCol: 'المستودع',
    ownerCol: 'المالك',
    purposeCol: 'الغرض',
    statusCol: 'الحالة',
    architecture: 'البنية',
    architectureIntro:
      'يستهلك التطبيق الإلكتروني SDK كحزمة داخل مساحة العمل وكحزمة مستقلة منشورة؛ ويبقى كود المحفظة في التطبيق. الواجهة الداخلية خدمة Node مستقلة بدون اعتماديات تتتبع التحويلات وتنفذ مطابقة للقراءة فقط. جمع الأسعار حزمة واجهة معزولة. ويتتبّع أصل العقد بشكل منفصل.',
    archPrism: 'الواجهة، مهايئ المحفظة، الإيصالات، وبيانات الممرات تبقى في jisr-web',
    archSdk: 'بدائيات الدفع المجمّدة المستهلكة من الويب والواجهة الخلفية',
    archApi: 'تتبّع دائم + حدود مطابقة (رمز الخدمة)',
    archRouting: 'واجهة المزود؛ لا مزودات حية بعد',
    archContract: 'فحص البايت كود المنشور؛ استرجاع المصدر قيد التنفيذ',
    paymentFlow: 'تدفق الدفع',
    flowStep: 'الخطوة',
    sdk: 'واجهة SDK (مجمّدة)',
    sdkIntro:
      'واجهة الواجهة الخلفية المستهلكة مجمّدة منذ الاستخراج وتُستورد من الباريل فقط. الأنواع: TransferSettlement، SavedTransfer، TransferStatus، HistoryStorage، NetworkConfig، TransactionResult.',
    sdkNote:
      'ملاحظة التغليف: الحزمة تشحن حالياً مخرجات TypeScript المصدرية فقط. مستهلكو Node المثبّتون ما زالوا يصطدمون بـ ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING حتى تُنشر JavaScript مجمّعة وإعلانات الأنواع.',
    api: 'الواجهة الداخلية',
    apiIntro:
      'أساس خاص بالخدمة على Node 24 + SQLite. جميع المسارات عدا health تتطلب Authorization: Bearer <SERVICE_TOKEN>. تنتقل المبالغ عبر الواجهة كسلاسل عشرية؛ وتكون القيم ستروبات صحيحة داخلياً.',
    apiNoAuth: 'عام',
    apiAuth: 'رمز',
    regFields: 'حقول التسجيل',
    reconcileTitle: 'نتائج المطابقة',
    reconcileBody:
      'فقط مُكيِّف يتحقق من شبكة Testnet، واستدعاء العقد، والعملة، والمرسل، والمستلم، والمبلغ من أدلة العمليات/الأحداث قد يعيد paymentVerified. علامة نجاح المعاملة وحدها غير كافية؛ المعاملات المفقودة والأخطاء العابرة تُبقي السجلات معلّقة أو مجهولة.',
    contract: 'عقد الموجّه والأدلة',
    contractIntro:
      'تشير الإعدادات الأساسية للعميل إلى عقد موجّه منشور على شبكة الاختبار. تم جلب بايت كود الدفتر وتجزئته؛ يوثّق هذا السلوك المرصود لا المصدر الأصلي. لا يجوز أبداً تقديم كود معاد بناؤه على أنه الأصل المنشور.',
    dev: 'التطوير',
    devIntro: 'أوامر إعادة الإنتاج عبر مساحة العمل والنسخ الخلفية الثلاث.',
    roadmap: 'خطة الطريق والحالة',
    security: 'الأمان والحدود',
    linksTitle: 'المصدر والتوثيق',
    pkgNote: 'التغليف',
    addrNote: 'التحقق من المجموع الاختباري قيد التنفيذ',
    sanityNote: 'لا تُخزَّن مفاتيح جديدة أو حمولات موقعة',
  },
};

export default function Docs() {
  const { t, lang, toggleLang, isRTL } = useI18nContext();
  const [, navigate] = useLocation();
  const L = lang === 'ar' ? text.ar : text.en;
  const pick = (b: Bi) => b[lang];

  const section = (
    id: string,
    label: string,
    icon: ReactNode,
    children: ReactNode,
  ) => (
    <section id={id} className="scroll-mt-24 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">{label}</h2>
      </div>
      {children}
    </section>
  );

  const prose = (n: string) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{n}</p>
  );

  const card = (children: ReactNode, className = '') => (
    <div className={`bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 ${className}`}>
      {children}
    </div>
  );

  const tableHead = (cols: string[]) => (
    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
      <tr className="border-b border-border/60">
        {cols.map((c) => (
          <th key={c} className="font-semibold py-2 pe-4">{c}</th>
        ))}
      </tr>
    </thead>
  );

  const toc = [
    { id: 'overview', label: L.overview },
    { id: 'repos', label: L.repos },
    { id: 'architecture', label: L.architecture },
    { id: 'payment-flow', label: L.paymentFlow },
    { id: 'sdk', label: L.sdk },
    { id: 'api', label: L.api },
    { id: 'contract', label: L.contract },
    { id: 'development', label: L.dev },
    { id: 'roadmap', label: L.roadmap },
    { id: 'security', label: L.security },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <nav className="w-full px-6 py-3 flex items-center justify-between z-50 bg-background/80 backdrop-blur-md sticky top-0 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            title={t('backToHome')}
            aria-label={t('backToHome')}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{t('home')}</span>
          </button>
          <span className="text-muted-foreground" aria-hidden="true">/</span>
          <span className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            {L.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary px-3 py-1.5 rounded-full"
          >
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full flex flex-col gap-14 py-12 px-6">
        <header className="max-w-4xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">{L.title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{L.subtitle}</p>
          <p className="text-xs text-muted-foreground/80 mt-2">{L.updated}: {new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB')}</p>
        </header>

        <section className="max-w-4xl mx-auto w-full bg-muted/40 border border-border/50 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{L.tocTitle}</p>
          <div className="flex flex-wrap gap-2">
            {toc.map((entry) => (
              <a
                key={entry.id}
                href={`#${entry.id}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-background border border-border rounded-full px-3 py-1"
              >
                {entry.label}
              </a>
            ))}
          </div>
        </section>

        {section('overview', L.overview, <BookOpen className="w-5 h-5" />,
          <div className="max-w-4xl">{prose(L.overviewBody)}</div>
        )}

        {section('repos', L.repos, <GitBranch className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.reposIntro)}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {tableHead([L.repoCol, L.ownerCol, L.purposeCol, L.statusCol])}
                <tbody>
                  {repos.map((r) => (
                    <tr key={r.name} className="border-b border-border/40 last:border-0 align-top">
                      <td className="py-3 pe-4">
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {r.name}<ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 pe-4 text-muted-foreground">{pick(r.owner)}</td>
                      <td className="py-3 pe-4">{pick(r.purpose)}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-1">{pick(r.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section('architecture', L.architecture, <Boxes className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.architectureIntro)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'jisr-web', note: L.archPrism },
                { name: 'jisr-sdk', note: L.archSdk },
                { name: 'jisr-api', note: L.archApi },
                { name: 'jisr-routing', note: L.archRouting },
                { name: 'payment-router-contract', note: L.archContract },
              ].map((layer, index) => (
                <div key={layer.name} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-muted text-muted-foreground rounded px-1.5 py-0.5">{index + 1}</span>
                    <span className="font-bold font-mono text-sm">{layer.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{layer.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {section('payment-flow', L.paymentFlow, <Layers className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            <ol className="flex flex-col gap-4">
              {flowSteps.map((step, index) => (
                <li key={index} className="flex gap-4 items-start">
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold">{pick(step.title)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pick(step.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {section('sdk', L.sdk, <Layers className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.sdkIntro)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sdk.map((group) => (
                <div key={group.group[lang]} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-primary">{pick(group.group)}</h3>
                  {group.items.map((item) => (
                    <p key={item.name} className="text-sm leading-relaxed">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{item.name}</code>
                    </p>
                  ))}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {group.items.map((item) => pick(item.note)).join(' ')}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-foreground">
              <p className="font-semibold mb-1">{L.pkgNote}</p>
              <p className="text-muted-foreground leading-relaxed">{L.sdkNote}</p>
            </div>
          </div>
        )}

        {section('api', L.api, <Database className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.apiIntro)}
            <div className="overflow-x-auto bg-card border border-border rounded-2xl">
              <table className="w-full text-sm">
                {tableHead(['Method', 'Route', L.overview, 'Auth'])}
                <tbody>
                  {endpoints.map((e) => (
                    <tr key={e.path} className="border-b border-border/40 last:border-0 align-top">
                      <td className="py-3 pe-4">
                        <span className={`text-xs font-bold rounded px-2 py-0.5 ${e.method === 'GET' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                          {e.method}
                        </span>
                      </td>
                      <td className="py-3 pe-4 font-mono text-[0.85em]">{e.path}</td>
                      <td className="py-3 pe-4 text-muted-foreground">{pick(e.summary)}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-muted-foreground">{e.auth ? L.apiAuth : L.apiNoAuth}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-2">
              <h3 className="font-bold">{L.regFields}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {tableHead(['Field', 'Rule'])}
                  <tbody>
                    {registrationFields.map((f) => (
                      <tr key={f.field} className="border-b border-border/40 last:border-0 align-top">
                        <td className="py-3 pe-4 font-mono text-[0.85em]">{f.field}</td>
                        <td className="py-3 text-muted-foreground">{pick(f.rule)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-2">
              <h3 className="font-bold">{L.reconcileTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{L.reconcileBody}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {outcomes.map((o) => (
                  <code key={o} className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{o}</code>
                ))}
              </div>
            </div>
          </div>
        )}

        {section('contract', L.contract, <ShieldCheck className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.contractIntro)}
            {card(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {contract.map((row, i) => (
                      <tr key={i} className="border-b border-border/40 last:border-0 align-top">
                        <td className="py-3 pe-6 font-semibold whitespace-nowrap">{pick(row.label)}</td>
                        <td className="py-3 font-mono text-[0.85em] break-all">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>,
            )}
          </div>
        )}

        {section('development', L.dev, <Code2 className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {prose(L.devIntro)}
            <div className="flex flex-col gap-3">
              {commands.map((c) => (
                <div key={c.run} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
                  <p className="text-sm font-semibold">{pick(c.what)}</p>
                  <code className="rounded bg-muted px-3 py-2 font-mono text-[0.85em] overflow-x-auto">{c.run}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {section('roadmap', L.roadmap, <Rocket className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            {roadmap.map((group) => (
              <div key={group.title[lang]} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
                <h3 className="font-bold">{pick(group.title)}</h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                      <span className="text-primary mt-1" aria-hidden="true">•</span>
                      <span>{pick(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {section('security', L.security, <ShieldCheck className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {securityItems.map((item, i) => (
                <li key={i} className="bg-card border border-border rounded-2xl p-5 text-sm leading-relaxed flex gap-3 items-start">
                  <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{pick(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section('links', L.linksTitle, <ExternalLink className="w-5 h-5" />,
          <div className="max-w-4xl flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.name}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-sm font-bold text-primary group-hover:underline">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{pick(l.note)}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        <footer className="max-w-4xl mx-auto w-full text-center text-xs text-muted-foreground border-t border-border/50 pt-6 pb-2">
          {t('mitLicense')}
        </footer>
      </main>
    </div>
  );
}
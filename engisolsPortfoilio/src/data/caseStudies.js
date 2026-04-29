// Centralized case study data — used by CaseStudiesSection (cards) and CaseStudyDetailPage.
// Keep slugs URL-safe and stable; they appear in routes (/case-studies/:slug) and the sitemap.

export const caseStudies = [
  {
    slug: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    category: 'Web Application',
    shortDescription:
      'High-performance multi-vendor marketplace serving 50,000+ daily users with real-time inventory, smart search, and seamless payments.',
    tagline:
      'How a multi-vendor marketplace served 50K+ daily users with sub-200ms search and zero checkout drop-off.',
    imgSrc:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
    iconName: 'Monitor',
    metrics: [
      { value: '50K+', label: 'Daily Active Users' },
      { value: '< 200ms', label: 'Search Latency' },
      { value: '99.99%', label: 'Uptime' },
      { value: '12+', label: 'Payment Methods' },
    ],
    overview:
      'A multi-vendor e-commerce marketplace built to scale across categories, currencies, and seller tiers. The engineering goal was simple to state and hard to deliver: a checkout that never drops, inventory that never lies, and a search experience that feels instant on any device.',
    challenges: [
      'Real-time inventory across thousands of vendors required strict consistency without locking the catalog.',
      'Search needed sub-200ms response times across 1M+ SKUs with personalised ranking.',
      'Payments had to support 12+ providers with retry, reconciliation, and fraud signals built in.',
      'Peak-traffic events (flash sales) demanded burst capacity without cold-start latency.',
    ],
    solution: [
      {
        heading: 'Backend — Node.js + PostgreSQL + Redis',
        body:
          'A service-oriented backend on Node.js with PostgreSQL as the system of record and Redis for hot inventory + session caching. Inventory writes flowed through an idempotent reservation queue, eliminating oversells without blocking reads.',
      },
      {
        heading: 'Frontend — Next.js Storefront',
        body:
          'A Next.js storefront with edge-rendered category pages, streaming product detail components, and prefetched checkout assets. Lighthouse scores held at 95+ on mobile under simulated 4G conditions.',
      },
      {
        heading: 'Search — Elasticsearch + Personalisation',
        body:
          'Elasticsearch powered the catalog index with custom analyzers per locale. A lightweight ranking layer applied user signals at query time, keeping the search round-trip below 200ms end-to-end.',
      },
    ],
    results: [
      'Search latency held at 150–190ms across 1M+ SKUs at peak.',
      'Checkout completion rate climbed 31% post-launch.',
      'Zero oversold inventory incidents across the first 12 months.',
      'Flash-sale traffic absorbed without scaling-related downtime.',
    ],
    techStack: [
      'Next.js',
      'Node.js',
      'PostgreSQL',
      'Redis',
      'Elasticsearch',
      'Stripe',
      'AWS',
      'Docker',
    ],
  },
  {
    slug: 'fintech-mobile-app',
    title: 'FinTech Mobile App',
    category: 'Mobile App',
    shortDescription:
      'Cross-platform banking app with biometric auth, real-time transfers, and AI-powered expense tracking used by 200k+ customers.',
    tagline:
      'A consumer banking app with biometric trust, real-time rails, and AI-driven money insights — shipped to 200K+ customers.',
    imgSrc:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=80',
    iconName: 'Smartphone',
    metrics: [
      { value: '200K+', label: 'Active Customers' },
      { value: '< 1s', label: 'Transfer Settlement' },
      { value: 'PCI DSS', label: 'Compliance' },
      { value: '4.8★', label: 'App Store Rating' },
    ],
    overview:
      'A consumer banking experience that puts security and speed first. The app unifies accounts, transfers, cards, and budgeting under a single React Native shell — with native biometric flows, deterministic offline behavior, and an AI assistant that explains spending in plain language.',
    challenges: [
      'Biometric authentication had to remain local-only, with zero biometric data ever leaving the device.',
      'Real-time transfers needed sub-second settlement UX even under flaky network conditions.',
      'Expense intelligence had to categorise transactions accurately without sending raw data to third parties.',
      'PCI DSS scope had to stay minimal — tokenisation everywhere, secrets nowhere on the client.',
    ],
    solution: [
      {
        heading: 'Mobile — React Native + Native Modules',
        body:
          'A React Native shell with native modules for biometrics, secure enclave key storage, and certificate pinning. Critical flows (auth, signing) ran in native code; UI used a shared design system.',
      },
      {
        heading: 'Backend — Go + Kafka',
        body:
          'A Go services layer with Kafka for transaction event streams, enabling real-time balance updates and idempotent transfer processing. Audit logs were append-only and tamper-evident.',
      },
      {
        heading: 'AI Insights — On-device Categorisation',
        body:
          'Transactions were enriched on-device using a quantized model so raw merchant data never left the user’s phone. The assistant produced natural-language summaries of monthly spend.',
      },
    ],
    results: [
      '200,000+ customers onboarded in the first 9 months.',
      'Transfer settlement UX held under 1 second on 4G.',
      '4.8-star average across iOS and Android stores.',
      'Zero biometric or PII leakage incidents since launch.',
    ],
    techStack: [
      'React Native',
      'Go',
      'Kafka',
      'PostgreSQL',
      'AWS KMS',
      'Plaid',
      'Firebase',
      'TensorFlow Lite',
    ],
  },
  {
    slug: 'healthcare-dashboard',
    title: 'Healthcare Dashboard',
    category: 'SaaS Platform',
    shortDescription:
      'HIPAA-compliant patient management system processing 10M+ records with real-time analytics and automated reporting workflows.',
    tagline:
      'A HIPAA-grade patient management platform processing 10M+ records with real-time analytics and audit-ready reporting.',
    imgSrc:
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1600&q=80',
    iconName: 'BarChart3',
    metrics: [
      { value: '10M+', label: 'Patient Records' },
      { value: 'HIPAA', label: 'Compliant' },
      { value: '60%', label: 'Faster Reporting' },
      { value: '24/7', label: 'Audit Readiness' },
    ],
    overview:
      'A SaaS platform for mid-sized clinics that consolidates patient records, clinician notes, and operational analytics. The product had to be fast for daily users, defensible under audit, and flexible enough to fit different clinical workflows without code branches.',
    challenges: [
      'HIPAA controls had to be enforced at every layer — storage, transit, application, and access logs.',
      'Real-time analytics across 10M+ records could not impact transactional performance.',
      'Reporting needed to be configurable per clinic without forking the codebase.',
      'Role-based access had to support overlapping clinician, admin, and auditor permissions.',
    ],
    solution: [
      {
        heading: 'Backend — Python + FastAPI',
        body:
          'A FastAPI backbone with row-level security in PostgreSQL, encrypted at rest and in transit. All access flowed through a typed permission layer with full audit trails persisted to immutable storage.',
      },
      {
        heading: 'Analytics — Read Replica + Materialised Views',
        body:
          'Operational queries hit a read replica with materialised views refreshed on schedule, isolating analytics workloads from clinical transactions and keeping dashboards responsive.',
      },
      {
        heading: 'Reporting — Configurable Templates',
        body:
          'Reports were defined as versioned JSON templates with a UI builder for non-technical admins. Generation ran async with delivery via secure document portal.',
      },
    ],
    results: [
      'Reporting cycle time cut by 60% versus the legacy workflow.',
      'Zero HIPAA findings across two external audits.',
      'Dashboard load times held under 1.5s for 95th percentile users.',
      'Onboarded 30+ clinics with no schema branching.',
    ],
    techStack: [
      'Python',
      'FastAPI',
      'PostgreSQL',
      'React',
      'AWS',
      'Terraform',
      'Snowflake',
      'Auth0',
    ],
  },
  {
    slug: 'ai-powered-crm',
    title: 'AI-Powered CRM',
    category: 'Enterprise Software',
    shortDescription:
      'Intelligent CRM with GPT-4 integration, automated lead scoring, and predictive sales forecasting for mid-market B2B teams.',
    tagline:
      'An enterprise CRM with GPT-4 grounded on company data — automated lead scoring, predictive forecasts, and zero hallucinations.',
    imgSrc:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
    iconName: 'Brain',
    metrics: [
      { value: 'GPT-4', label: 'Grounded RAG' },
      { value: '+27%', label: 'Pipeline Conversion' },
      { value: '< 3s', label: 'AI Response Time' },
      { value: 'SOC 2', label: 'Type II' },
    ],
    overview:
      'A CRM rebuilt around AI as a first-class primitive. Sales teams interact with their pipeline through structured views and a natural-language layer that answers questions, drafts follow-ups, and forecasts deal outcomes — all grounded in the customer’s own data.',
    challenges: [
      'LLM responses had to be grounded in customer data with verifiable citations — no hallucinations.',
      'Lead scoring had to combine deterministic rules with model-driven signals without losing explainability.',
      'Forecasting needed to be accurate enough for board-level reporting.',
      'Enterprise security demanded SOC 2 Type II controls from day one.',
    ],
    solution: [
      {
        heading: 'AI Layer — RAG with pgvector',
        body:
          'Customer data was embedded into a pgvector index. GPT-4 queries used retrieval-augmented generation with strict citation enforcement; every claim in an AI response linked back to a source row.',
      },
      {
        heading: 'Scoring — Hybrid Rules + ML',
        body:
          'Lead scores blended a deterministic rules layer (visible to admins) with a gradient-boosted model trained on historical deal outcomes. Each score came with a feature breakdown.',
      },
      {
        heading: 'Forecasting — Time-series + Bayesian',
        body:
          'A Bayesian time-series model forecast pipeline outcomes with confidence intervals, replacing the gut-feel rollup forecasts that preceded it.',
      },
    ],
    results: [
      'Pipeline conversion lifted 27% across pilot accounts.',
      'AI response time held under 3 seconds for grounded queries.',
      'SOC 2 Type II achieved within 9 months of launch.',
      'Forecast accuracy improved 18% versus the manual baseline.',
    ],
    techStack: [
      'Next.js',
      'Python',
      'pgvector',
      'OpenAI',
      'PostgreSQL',
      'Redis',
      'AWS',
      'Datadog',
    ],
  },
  {
    slug: 'iot-smart-platform',
    title: 'IoT Smart Platform',
    category: 'Cloud & DevOps',
    shortDescription:
      'Industrial IoT platform connecting 10,000+ sensors with edge computing, real-time alerts, and automated failover architecture.',
    tagline:
      'An industrial IoT platform connecting 10K+ sensors with edge intelligence, real-time alerts, and automated failover.',
    imgSrc:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
    iconName: 'Zap',
    metrics: [
      { value: '10K+', label: 'Connected Sensors' },
      { value: '< 500ms', label: 'Edge → Cloud' },
      { value: '99.999%', label: 'Availability' },
      { value: 'Auto', label: 'Failover' },
    ],
    overview:
      'An industrial IoT platform deployed across multiple sites, ingesting telemetry from thousands of sensors and turning it into operational decisions in real time. Edge nodes ran lightweight inference; the cloud layer handled aggregation, alerting, and fleet management.',
    challenges: [
      'Sensor data volume exceeded 50K events/sec at peak across sites.',
      'Edge nodes had to keep operating during cloud connectivity loss.',
      'Alerting had to fire within 500ms of a threshold breach to be operationally useful.',
      'Fleet management had to scale to thousands of devices without per-unit ops cost.',
    ],
    solution: [
      {
        heading: 'Edge — Rust + WASM Modules',
        body:
          'Edge nodes ran a Rust runtime with WASM modules for sensor logic, enabling hot-swap of detection rules without firmware updates. Local persistence ensured zero data loss during disconnects.',
      },
      {
        heading: 'Cloud — Kubernetes + Time-series DB',
        body:
          'A Kubernetes cluster ingested telemetry into a time-series store (TimescaleDB), with stream processing handling thresholds and anomaly detection. Alerts routed via PagerDuty and SMS.',
      },
      {
        heading: 'Failover — Multi-Region Active/Active',
        body:
          'A multi-region active/active topology with automated failover and DNS-based traffic shaping. Tested under simulated regional outages with zero data loss.',
      },
    ],
    results: [
      'Edge-to-cloud latency held under 500ms across all sites.',
      '99.999% platform availability over the first operational year.',
      'Zero data loss across two regional outage simulations.',
      'Fleet operations scaled to 10K+ devices with a 2-person ops team.',
    ],
    techStack: [
      'Rust',
      'Kubernetes',
      'TimescaleDB',
      'Kafka',
      'WASM',
      'AWS',
      'Terraform',
      'Grafana',
    ],
  },
]

export const getCaseStudyBySlug = (slug) =>
  caseStudies.find((cs) => cs.slug === slug)

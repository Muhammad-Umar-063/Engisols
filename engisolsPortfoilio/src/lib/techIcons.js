import { FaAws } from 'react-icons/fa'
import {
  SiApachekafka,
  SiAuth0,
  SiDatadog,
  SiDocker,
  SiElasticsearch,
  SiFastapi,
  SiFirebase,
  SiGo,
  SiGrafana,
  SiKubernetes,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenai,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRust,
  SiSnowflake,
  SiStripe,
  SiTensorflow,
  SiTerraform,
  SiTimescale,
  SiWebassembly,
} from 'react-icons/si'

// Official brand logos for the technologies listed in `caseStudies.js`.
//
// Keys are normalized (lowercase, alphanumerics only) so 'Next.js', 'nextjs'
// and 'NEXT JS' all resolve to the same entry — see `normalize()` below.
//
// Plaid and pgvector are absent on purpose: neither has an official logo in
// the icon set, and inventing one would be worse than showing none. Their
// pills render as text only, which `techIcon()` handles by returning null.
const ICONS = {
  apachekafka: SiApachekafka,
  auth0: SiAuth0,
  aws: FaAws,
  awskms: FaAws,
  datadog: SiDatadog,
  docker: SiDocker,
  elasticsearch: SiElasticsearch,
  fastapi: SiFastapi,
  firebase: SiFirebase,
  go: SiGo,
  golang: SiGo,
  grafana: SiGrafana,
  kafka: SiApachekafka,
  kubernetes: SiKubernetes,
  nextjs: SiNextdotjs,
  nodejs: SiNodedotjs,
  openai: SiOpenai,
  postgres: SiPostgresql,
  postgresql: SiPostgresql,
  python: SiPython,
  react: SiReact,
  reactnative: SiReact,
  redis: SiRedis,
  rust: SiRust,
  snowflake: SiSnowflake,
  stripe: SiStripe,
  tensorflow: SiTensorflow,
  tensorflowlite: SiTensorflow,
  terraform: SiTerraform,
  timescale: SiTimescale,
  timescaledb: SiTimescale,
  wasm: SiWebassembly,
  webassembly: SiWebassembly,
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Returns the brand logo component for a technology name, or null when the
 * technology has no official logo available.
 */
export function techIcon(name) {
  return ICONS[normalize(name)] ?? null
}

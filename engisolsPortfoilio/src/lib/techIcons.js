import { FaAws } from 'react-icons/fa'
import {
  SiApachekafka,
  SiAuth0,
  SiDatadog,
  SiDocker,
  SiElasticsearch,
  SiExpress,
  SiFastapi,
  SiFirebase,
  SiGo,
  SiGrafana,
  SiJsonwebtokens,
  SiKubernetes,
  SiMongodb,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenai,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReact,
  SiRedis,
  SiRedux,
  SiRust,
  SiSnowflake,
  SiStripe,
  SiTailwindcss,
  SiTensorflow,
  SiTerraform,
  SiTimescale,
  SiTypescript,
  SiWeb3Dotjs,
  SiWebassembly,
  SiWebrtc,
} from 'react-icons/si'

// Official brand logos + official brand colors for the technologies listed in
// `caseStudies.js`.
//
// Keys are normalized (lowercase, alphanumerics only) so 'Next.js', 'nextjs'
// and 'NEXT JS' all resolve to the same entry — see `normalize()` below.
//
// A few brands whose primary colour is black or near-black (Next.js, Rust,
// Kafka, OpenAI) use their official reversed/white mark instead — the version
// those brand guidelines specify for dark backgrounds. Rendering them in
// #000 on this site's near-black surface would make them invisible.
// Elasticsearch uses Elastic's brand teal for the same legibility reason.
//
// Plaid and pgvector are absent on purpose: neither has an official logo in
// the icon set. `techIcon()` returns null for them and the UI falls back to
// their name, so the technology isn't silently dropped.
const ICONS = {
  apachekafka: { Icon: SiApachekafka, color: '#FFFFFF' },
  auth0: { Icon: SiAuth0, color: '#EB5424' },
  aws: { Icon: FaAws, color: '#FF9900' },
  awskms: { Icon: FaAws, color: '#FF9900' },
  datadog: { Icon: SiDatadog, color: '#8A56D6' },
  docker: { Icon: SiDocker, color: '#2496ED' },
  elasticsearch: { Icon: SiElasticsearch, color: '#00BFB3' },
  express: { Icon: SiExpress, color: '#FFFFFF' },
  expressjs: { Icon: SiExpress, color: '#FFFFFF' },
  fastapi: { Icon: SiFastapi, color: '#009688' },
  firebase: { Icon: SiFirebase, color: '#FFCA28' },
  go: { Icon: SiGo, color: '#00ADD8' },
  golang: { Icon: SiGo, color: '#00ADD8' },
  grafana: { Icon: SiGrafana, color: '#F46800' },
  jsonwebtoken: { Icon: SiJsonwebtokens, color: '#FFFFFF' },
  jwt: { Icon: SiJsonwebtokens, color: '#FFFFFF' },
  kafka: { Icon: SiApachekafka, color: '#FFFFFF' },
  kubernetes: { Icon: SiKubernetes, color: '#326CE5' },
  mongodb: { Icon: SiMongodb, color: '#47A248' },
  nextjs: { Icon: SiNextdotjs, color: '#FFFFFF' },
  nodejs: { Icon: SiNodedotjs, color: '#5FA04E' },
  openai: { Icon: SiOpenai, color: '#FFFFFF' },
  postgres: { Icon: SiPostgresql, color: '#4169E1' },
  postgresql: { Icon: SiPostgresql, color: '#4169E1' },
  prisma: { Icon: SiPrisma, color: '#FFFFFF' },
  python: { Icon: SiPython, color: '#3776AB' },
  react: { Icon: SiReact, color: '#61DAFB' },
  reactnative: { Icon: SiReact, color: '#61DAFB' },
  redis: { Icon: SiRedis, color: '#FF4438' },
  redux: { Icon: SiRedux, color: '#764ABC' },
  rust: { Icon: SiRust, color: '#FFFFFF' },
  snowflake: { Icon: SiSnowflake, color: '#29B5E8' },
  stripe: { Icon: SiStripe, color: '#635BFF' },
  tailwind: { Icon: SiTailwindcss, color: '#38BDF8' },
  tailwindcss: { Icon: SiTailwindcss, color: '#38BDF8' },
  tensorflow: { Icon: SiTensorflow, color: '#FF6F00' },
  tensorflowlite: { Icon: SiTensorflow, color: '#FF6F00' },
  terraform: { Icon: SiTerraform, color: '#844FBA' },
  timescale: { Icon: SiTimescale, color: '#FDB515' },
  timescaledb: { Icon: SiTimescale, color: '#FDB515' },
  typescript: { Icon: SiTypescript, color: '#3178C6' },
  wasm: { Icon: SiWebassembly, color: '#654FF0' },
  web3: { Icon: SiWeb3Dotjs, color: '#F16822' },
  webassembly: { Icon: SiWebassembly, color: '#654FF0' },
  webrtc: { Icon: SiWebrtc, color: '#FFFFFF' },
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Returns `{ Icon, color }` for a technology name, or null when the technology
 * has no official logo available.
 */
export function techIcon(name) {
  return ICONS[normalize(name)] ?? null
}

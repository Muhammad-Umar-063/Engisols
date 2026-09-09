import { createRequire } from 'node:module'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { scanPublicUrl, DEFAULT_SCAN_LIMITS } = require(
  '../.scanner-test-dist/src/scanner/index.js',
)
const {
  assertRegressionCorpus,
  parseRegressionConcurrency,
  regressionRunShouldFail,
} = require('../.scanner-test-dist/scripts/scanner-regression-policy.js')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const corpusPath = resolve(root, 'tests/scanner/regression-corpus.json')
const outputPath = resolve(
  root,
  process.argv[2] ?? 'tests/scanner/regression-results-full.json',
)
const concurrency = parseRegressionConcurrency(
  process.env.SCANNER_REGRESSION_CONCURRENCY,
)
const corpus = JSON.parse(await readFile(corpusPath, 'utf8'))
assertRegressionCorpus(corpus)
const runStartedAt = new Date().toISOString()
const runStartedMonotonic = performance.now()
const runCpuStartedAt = process.cpuUsage()
const runResourceStartedAt = process.resourceUsage()
const runEluStartedAt = performance.eventLoopUtilization()
let nextIndex = 0
let completedCount = 0
const results = new Array(corpus.length)
let checkpointChain = Promise.resolve()

async function worker() {
  while (true) {
    const index = nextIndex++
    if (index >= corpus.length) return

    const target = corpus[index]
    const startedAt = Date.now()
    const cpuStartedAt = process.cpuUsage()
    const eluStartedAt = performance.eventLoopUtilization()
    const memoryStartedAt = process.memoryUsage()
    let peakRssBytes = memoryStartedAt.rss
    let peakHeapUsedBytes = memoryStartedAt.heapUsed
    const memorySampler = setInterval(() => {
      const memory = process.memoryUsage()
      peakRssBytes = Math.max(peakRssBytes, memory.rss)
      peakHeapUsedBytes = Math.max(peakHeapUsedBytes, memory.heapUsed)
    }, 50)

    try {
      // Intentionally omit overrides: this exercises the exact production defaults.
      const result = await scanPublicUrl(target.url)
      results[index] = {
        ...target,
        outcome: 'scanned',
        status: result.status,
        finalUrl: result.target.finalUrl,
        httpStatus: result.target.httpStatus,
        durationMs: result.durationMs,
        wallTimeMs: Date.now() - startedAt,
        score: result.score,
        assessment: result.assessment,
        summary: result.summary,
        coverage: result.coverage,
        findings: result.findings.map((finding) => ({
          ruleId: finding.ruleId,
          classification: finding.classification,
          category: finding.category,
          sourceKind: finding.evidence.sourceKind,
        })),
      }
    } catch (error) {
      results[index] = {
        ...target,
        outcome: 'failed',
        wallTimeMs: Date.now() - startedAt,
        errorCode: typeof error?.code === 'string' ? error.code : 'unexpected_error',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }
    } finally {
      clearInterval(memorySampler)
      const wallTimeMs = Date.now() - startedAt
      const cpu = process.cpuUsage(cpuStartedAt)
      const elu = performance.eventLoopUtilization(eluStartedAt)
      const memoryFinishedAt = process.memoryUsage()
      results[index].wallTimeMs = wallTimeMs
      results[index].runtime = {
        metricScope: concurrency === 1 ? 'target' : 'shared_process_overlap',
        cpuUserMs: roundMicrosToMs(cpu.user),
        cpuSystemMs: roundMicrosToMs(cpu.system),
        cpuTotalMs: roundMicrosToMs(cpu.user + cpu.system),
        cpuUtilizationPercent: wallTimeMs
          ? round(((cpu.user + cpu.system) / 1_000 / wallTimeMs) * 100, 2)
          : 0,
        eventLoopUtilization: round(elu.utilization, 4),
        rssStartBytes: memoryStartedAt.rss,
        rssEndBytes: memoryFinishedAt.rss,
        peakRssBytes: Math.max(peakRssBytes, memoryFinishedAt.rss),
        heapUsedStartBytes: memoryStartedAt.heapUsed,
        heapUsedEndBytes: memoryFinishedAt.heapUsed,
        peakHeapUsedBytes: Math.max(
          peakHeapUsedBytes,
          memoryFinishedAt.heapUsed,
        ),
      }

      const result = results[index]
      const detail =
        result.outcome === 'scanned'
          ? `${result.status} ${result.coverage.scripts.scanned}/${result.coverage.scripts.discovered} JS`
          : result.errorCode
      process.stdout.write(
        `${index + 1}/${corpus.length} ${target.platform} ${result.outcome} ${detail} ${wallTimeMs}ms CPU ${result.runtime.cpuTotalMs}ms RSS ${formatMiB(result.runtime.peakRssBytes)}MiB\n`,
      )
      completedCount += 1
      if (completedCount % 10 === 0) {
        await queueCheckpoint('running')
      }
    }
  }
}

await queueCheckpoint('running')
await Promise.all(Array.from({ length: concurrency }, () => worker()))
await checkpointChain
const report = await writeCheckpoint('completed')
process.stdout.write(`Report: ${outputPath}\n`)
process.stdout.write(
  `${JSON.stringify({ totals: report.totals, aggregate: report.aggregate, runtime: report.runtime }, null, 2)}\n`,
)
if (regressionRunShouldFail(report.totals, corpus.length)) {
  process.exitCode = 1
}

function queueCheckpoint(runStatus) {
  checkpointChain = checkpointChain.then(() => writeCheckpoint(runStatus))
  return checkpointChain
}

async function writeCheckpoint(runStatus) {
  const report = buildReport(runStatus)
  const temporaryPath = `${outputPath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, outputPath)
  return report
}

function buildReport(runStatus) {
  const completedResults = results.filter(Boolean)
  const platforms = [...new Set(corpus.map(({ platform }) => platform))]
  const aggregate = Object.fromEntries(
    platforms.map((platform) => {
      const expected = corpus.filter((target) => target.platform === platform)
      const platformResults = completedResults.filter(
        (result) => result.platform === platform,
      )
      const scanned = platformResults.filter(
        (result) => result.outcome === 'scanned',
      )
      return [
        platform,
        {
          totalInCorpus: expected.length,
          processed: platformResults.length,
          scanned: scanned.length,
          failed: platformResults.filter(({ outcome }) => outcome === 'failed')
            .length,
          completed: scanned.filter(({ status }) => status === 'completed')
            .length,
          partial: scanned.filter(({ status }) => status === 'partial').length,
          documentsScanned: sum(
            scanned,
            (result) => result.coverage.documents.scanned,
          ),
          scriptsDiscovered: sum(
            scanned,
            (result) => result.coverage.scripts.discovered,
          ),
          scriptsScanned: sum(
            scanned,
            (result) => result.coverage.scripts.scanned,
          ),
          bytesScanned: sum(
            scanned,
            (result) => result.coverage.bytesScanned,
          ),
          findings: {
            total: sum(scanned, (result) => result.summary.total),
            byDesign: sum(scanned, (result) => result.summary.byDesign),
            needsProof: sum(scanned, (result) => result.summary.needsProof),
            actuallyBad: sum(scanned, (result) => result.summary.actuallyBad),
          },
          averageWallTimeMs: average(platformResults, 'wallTimeMs'),
          averageCpuTotalMs: averageRuntime(platformResults, 'cpuTotalMs'),
          averageCpuUtilizationPercent: averageRuntime(
            platformResults,
            'cpuUtilizationPercent',
          ),
          peakRssBytes: Math.max(
            0,
            ...platformResults.map(({ runtime }) => runtime.peakRssBytes),
          ),
          coverageConfidence: countBy(
            scanned,
            (result) => result.assessment.coverage.confidence,
          ),
          recommendations: countBy(
            scanned,
            (result) => result.assessment.recommendation,
          ),
        },
      ]
    }),
  )

  const cpu = process.cpuUsage(runCpuStartedAt)
  const resource = process.resourceUsage()
  const elu = performance.eventLoopUtilization(runEluStartedAt)
  const wallTimeMs = Math.round(performance.now() - runStartedMonotonic)

  return {
    schemaVersion: 'scanner-regression-v1',
    runStatus,
    runStartedAt,
    runFinishedAt: runStatus === 'completed' ? new Date().toISOString() : null,
    mode: 'production_defaults_passive_public_surface',
    concurrency,
    perTargetRuntimeMetricScope:
      concurrency === 1 ? 'target' : 'shared_process_overlap',
    limits: DEFAULT_SCAN_LIMITS,
    aggregate,
    totals: {
      inCorpus: corpus.length,
      processed: completedResults.length,
      scanned: completedResults.filter(({ outcome }) => outcome === 'scanned')
        .length,
      failed: completedResults.filter(({ outcome }) => outcome === 'failed')
        .length,
    },
    runtime: {
      wallTimeMs,
      cpuUserMs: roundMicrosToMs(cpu.user),
      cpuSystemMs: roundMicrosToMs(cpu.system),
      cpuTotalMs: roundMicrosToMs(cpu.user + cpu.system),
      cpuUtilizationPercent: wallTimeMs
        ? round(((cpu.user + cpu.system) / 1_000 / wallTimeMs) * 100, 2)
        : 0,
      eventLoopUtilization: round(elu.utilization, 4),
      currentMemory: process.memoryUsage(),
      resourceUsage: {
        maxRssKilobytes: resource.maxRSS,
        minorPageFaults: resource.minorPageFault - runResourceStartedAt.minorPageFault,
        majorPageFaults: resource.majorPageFault - runResourceStartedAt.majorPageFault,
        voluntaryContextSwitches:
          resource.voluntaryContextSwitches -
          runResourceStartedAt.voluntaryContextSwitches,
        involuntaryContextSwitches:
          resource.involuntaryContextSwitches -
          runResourceStartedAt.involuntaryContextSwitches,
        fsRead: resource.fsRead - runResourceStartedAt.fsRead,
        fsWrite: resource.fsWrite - runResourceStartedAt.fsWrite,
      },
    },
    results: completedResults,
  }
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0)
}

function countBy(items, selector) {
  const counts = {}
  for (const item of items) {
    const key = selector(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function average(items, key) {
  if (!items.length) return 0
  return Math.round(sum(items, (item) => item[key]) / items.length)
}

function averageRuntime(items, key) {
  if (!items.length) return 0
  return round(sum(items, (item) => item.runtime[key]) / items.length, 2)
}

function roundMicrosToMs(microseconds) {
  return round(microseconds / 1_000, 3)
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function formatMiB(bytes) {
  return round(bytes / 1_048_576, 1)
}

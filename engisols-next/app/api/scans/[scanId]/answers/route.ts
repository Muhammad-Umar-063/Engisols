import { isValidPublicScanId } from '../../../../../src/production-check/report'
import { readLimitedJson } from '../../../../../src/production-check/request'
import { getScanStore, ScanStoreConfigurationError } from '../../../../../src/production-check/store'
import {
  BUILDER_ANSWERS,
  LAUNCH_STAGE_ANSWERS,
  type ScanAnswers,
} from '../../../../../src/production-check/types'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/scans/[scanId]/answers'>,
): Promise<Response> {
  const { scanId } = await context.params
  if (!isValidPublicScanId(scanId)) return invalid()
  let answers: ScanAnswers
  try {
    const parsed = await readLimitedJson(request)
    answers = parseAnswers(parsed)
  } catch {
    return invalid()
  }
  try {
    const store = getScanStore()
    if (!(await store.updateAnswers(scanId, answers))) {
      return Response.json(
        { ok: false, error: { code: 'not_found', message: 'This scan could not be found or has expired.' } },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof ScanStoreConfigurationError
      ? 'Scan answers are temporarily unavailable.'
      : 'We could not save that answer. Please try again.'
    return Response.json(
      { ok: false, error: { code: 'persistence_unavailable', message } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

function parseAnswers(value: unknown): ScanAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid')
  const keys = Object.keys(value)
  if (keys.length === 0 || keys.some((key) => key !== 'builder' && key !== 'launchStage')) {
    throw new Error('invalid')
  }
  const input = value as Record<string, unknown>
  const answers: ScanAnswers = {}
  if (input.builder !== undefined) {
    if (!BUILDER_ANSWERS.includes(input.builder as never)) throw new Error('invalid')
    answers.builder = input.builder as ScanAnswers['builder']
  }
  if (input.launchStage !== undefined) {
    if (!LAUNCH_STAGE_ANSWERS.includes(input.launchStage as never)) throw new Error('invalid')
    answers.launchStage = input.launchStage as ScanAnswers['launchStage']
  }
  return answers
}

function invalid(): Response {
  return Response.json(
    { ok: false, error: { code: 'invalid_request', message: 'Choose one of the available answers.' } },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )
}

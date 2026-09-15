import { NextResponse } from 'next/server'

import { OPERATOR_LINK_LIFETIME_MS } from '../../../../../../src/production-check/config'
import { OPERATOR_COOKIE_NAME, operatorCookiePath } from '../../../../../../src/production-check/operator-session.server'
import { productionCheckOperatorSecret, verifyOperatorToken } from '../../../../../../src/production-check/operator-token.server'
import { isValidScopeReviewId } from '../../../../../../src/production-check/scope-review'
import { getScopeReviewStore } from '../../../../../../src/production-check/store'
import type { ScopeReviewStore } from '../../../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ scopeReviewId: string }> }

export function createOperatorAccessGetHandler({
  reviews,
  secret,
  now = () => new Date(),
}: { reviews?: ScopeReviewStore; secret?: string; now?: () => Date } = {}) {
  return async function GET(request: Request, context: RouteContext): Promise<Response> {
    const { scopeReviewId } = await context.params
    const token = new URL(request.url).searchParams.get('token') ?? ''
    const signingSecret = secret ?? productionCheckOperatorSecret()
    if (
      !isValidScopeReviewId(scopeReviewId) ||
      !verifyOperatorToken(token, scopeReviewId, signingSecret, now)
    ) {
      return new Response('Operator link is invalid or expired.', {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      })
    }
    const review = await (reviews ?? getScopeReviewStore()).get(scopeReviewId).catch(() => null)
    if (!review) return new Response('Scope review not found.', { status: 404, headers: { 'Cache-Control': 'no-store' } })

    const destination = new URL(`/internal/production-check/review/${encodeURIComponent(scopeReviewId)}`, request.url)
    const response = NextResponse.redirect(destination, 303)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.cookies.set(OPERATOR_COOKIE_NAME, token, {
      httpOnly: true,
      secure: destination.protocol === 'https:',
      sameSite: 'strict',
      path: operatorCookiePath(scopeReviewId),
      maxAge: Math.floor(OPERATOR_LINK_LIFETIME_MS / 1_000),
    })
    return response
  }
}

export const GET = createOperatorAccessGetHandler()

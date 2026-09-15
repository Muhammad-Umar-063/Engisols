import { verifyOperatorToken, productionCheckOperatorSecret } from './operator-token.server'

export const OPERATOR_COOKIE_NAME = 'engisols_pc_operator'

export function operatorCookiePath(scopeReviewId: string): string {
  return `/internal/production-check/review/${encodeURIComponent(scopeReviewId)}`
}

export function operatorTokenFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie') ?? ''
  for (const part of cookie.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === OPERATOR_COOKIE_NAME) return decodeURIComponent(value.join('='))
  }
  return undefined
}

export function authorizeOperatorRequest(
  request: Request,
  scopeReviewId: string,
  now: () => Date = () => new Date(),
): boolean {
  const token = operatorTokenFromRequest(request)
  if (!token) return false
  try {
    return verifyOperatorToken(token, scopeReviewId, productionCheckOperatorSecret(), now)
  } catch {
    return false
  }
}

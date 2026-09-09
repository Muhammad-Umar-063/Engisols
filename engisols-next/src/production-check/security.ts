const rawCredentialPatterns = [
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAIza[A-Za-z0-9_-]{35}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}\b/,
]

const credentialAssignmentPattern =
  /\b([A-Za-z][A-Za-z0-9_]*(?:_SECRET|_TOKEN))["']?\s*(?:=|:)\s*["']?([^"'\s,;}]{12,})/gi

const placeholderPattern =
  /^(?:<[^>]+>|(?:your|replace|change)[-_ ]?(?:me[-_ ]?)?(?:secret|token|value)(?:[-_ ]?here)?|(?:example|sample|dummy|fake|test|not[-_ ]?real|redacted)[-_ ]*(?:secret|token|value)?)$/i

export function containsCredentialLikeValue(value: unknown): boolean {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value) ?? ''
  if (rawCredentialPatterns.some((pattern) => pattern.test(serialized))) return true

  credentialAssignmentPattern.lastIndex = 0
  for (const match of serialized.matchAll(credentialAssignmentPattern)) {
    const candidate = match[2] ?? ''
    if (isHighEntropyAssignedCredential(candidate)) return true
  }
  return false
}

function isHighEntropyAssignedCredential(candidate: string): boolean {
  const normalized = candidate.replace(/["']$/, '')
  if (normalized.length < 20 || placeholderPattern.test(normalized)) return false
  if (/^(.)\1+$/.test(normalized)) return false

  const counts = new Map<string, number>()
  for (const character of normalized) {
    counts.set(character, (counts.get(character) ?? 0) + 1)
  }
  const entropy = [...counts.values()].reduce((total, count) => {
    const probability = count / normalized.length
    return total - probability * Math.log2(probability)
  }, 0)
  return entropy >= 3.3
}

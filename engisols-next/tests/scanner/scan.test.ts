import assert from 'node:assert/strict'
import test from 'node:test'

import { ScannerError } from '../../src/scanner/errors'
import type { RequestOnce } from '../../src/scanner/public-fetch'
import { scanPublicUrl } from '../../src/scanner/scan'
import {
  openAiSecretKey,
  stripeSecretKey,
} from './fixtures/dangerous-secrets'
import { supabasePublishableKey } from './fixtures/legitimate-public-config'

const secureHeaders = {
  'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
  'content-type': 'text/html; charset=utf-8',
  'permissions-policy': 'camera=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
}

const resolveHost = async () => [
  { address: '93.184.216.34', family: 4 as const },
]

function response(
  status: number,
  body: string,
  headers: Record<string, string> = {},
) {
  const buffer = Buffer.from(body)
  return {
    status,
    headers,
    body: buffer,
    wireBytes: buffer.byteLength,
  }
}

test('assembles a stable report across linked routes and lazy bundles', async () => {
  const requestOnce: RequestOnce = async ({ target }) => {
    switch (target.url.pathname) {
      case '/':
        return response(
          200,
          `<a href="/about">About</a><script src="/entry.js"></script>`,
          secureHeaders,
        )
      case '/about':
        return response(
          200,
          `<script>const client=createClient('https://fixture.supabase.co','${supabasePublishableKey}');client.from('payments')</script>`,
          secureHeaders,
        )
      case '/entry.js':
        return response(
          200,
          `import('./lazy.js')`,
          { 'content-type': 'application/javascript' },
        )
      case '/lazy.js':
        return response(
          200,
          `const key='${stripeSecretKey}'`,
          { 'content-type': 'application/javascript' },
        )
      default:
        return response(404, 'not found', { 'content-type': 'text/plain' })
    }
  }
  const times = [1_000, 1_012]

  const result = await scanPublicUrl('https://app.example/?campaign=meta', {
    resolveHost,
    requestOnce,
    fingerprintKey: Buffer.alloc(32, 1),
    now: () => times.shift() ?? 1_012,
  })

  assert.equal(result.status, 'completed')
  assert.deepEqual(result.coverage.documents, {
    discovered: 2,
    attempted: 2,
    scanned: 2,
  })
  assert.deepEqual(result.coverage.scripts, {
    discovered: 2,
    attempted: 2,
    scanned: 2,
  })
  assert.equal(result.target.requestedUrl, 'https://app.example/')
  assert.equal(result.durationMs, 12)
  assert.equal(result.assessment.modelVersion, 'scanner-v1.1')
  assert.equal(result.assessment.exposure.actuallyBad, 1)
  assert.equal(result.assessment.recommendation, 'urgent_review')
  assert.equal(result.assessment.coverage.confidence, 'partial')
  assert.equal(result.assessment.groups.length, 2)
  assert.equal(
    result.findings.some(({ ruleId }) => ruleId === 'stripe.secret_key'),
    true,
  )
  assert.equal(
    result.findings.some(({ ruleId }) => ruleId === 'supabase.sensitive_table'),
    true,
  )
  assert.equal(JSON.stringify(result).includes(stripeSecretKey), false)
})

test('returns a partial report when a child asset fails', async () => {
  const requestOnce: RequestOnce = async ({ target }) => {
    if (target.url.pathname === '/') {
      return response(
        200,
        `<script src="/missing.js"></script>`,
        secureHeaders,
      )
    }
    throw new ScannerError('target_unavailable')
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    fingerprintKey: Buffer.alloc(32, 1),
  })

  assert.equal(result.status, 'partial')
  assert.notEqual(result.assessment.coverage.confidence, 'strong')
  assert.equal(result.coverage.scripts.attempted, 1)
  assert.equal(result.coverage.scripts.scanned, 0)
  assert.equal(
    result.checks.find(({ id }) => id === 'credentials')?.status,
    'partial',
  )
})

test('returns partial main evidence when discovery reaches the total deadline', async () => {
  const paths: string[] = []
  const startedAt = Date.now()
  let clockCalls = 0
  const deadlineNow = () => {
    clockCalls += 1
    return clockCalls >= 5 ? startedAt + 1_000 : startedAt
  }
  const requestOnce: RequestOnce = async ({ target }) => {
    paths.push(target.url.pathname)
    return response(
      200,
      `<main>Observed</main><script>const key='${stripeSecretKey}'</script>`,
      secureHeaders,
    )
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    fingerprintKey: Buffer.alloc(32, 1),
    deadlineNow,
    limits: { totalTimeoutMs: 1_000 },
  })

  assert.deepEqual(paths, ['/'])
  assert.equal(result.status, 'partial')
  assert.deepEqual(result.coverage.limitsReached, ['total_timeout'])
  assert.equal(
    result.findings.some(({ ruleId }) => ruleId === 'stripe.secret_key'),
    true,
  )
})

test('reports unsafe route omissions as partial coverage', async () => {
  const requestOnce: RequestOnce = async ({ target }) => {
    if (target.url.pathname === '/') {
      return response(
        200,
        '<a href="/logout">Sign out</a><a href="/account?tab=billing">Account</a>',
        secureHeaders,
      )
    }
    if (target.url.pathname === '/robots.txt') {
      return response(200, 'Allow: /api/status', {
        'content-type': 'text/plain',
      })
    }
    return response(404, 'not found', { 'content-type': 'text/plain' })
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
  })

  assert.equal(result.status, 'partial')
  assert.notEqual(result.assessment.coverage.confidence, 'strong')
  assert.deepEqual(result.coverage.skipped, [
    { reason: 'unsafe_metadata_reference', count: 1 },
    { reason: 'unsafe_route', count: 2 },
  ])
  assert.equal(
    result.assessment.coverage.reasons.includes(
      '3 route references were excluded from passive traversal by the route safety policy.',
    ),
    true,
  )
})

test('fails without a report when the main response is unavailable', async () => {
  const requestOnce: RequestOnce = async () => {
    throw new ScannerError('target_unavailable')
  }

  await assert.rejects(
    scanPublicUrl('https://app.example/', {
      resolveHost,
      requestOnce,
      fingerprintKey: Buffer.alloc(32, 1),
    }),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})

test('marks bundle caps and never attempts undiscovered overflow', async () => {
  const paths: string[] = []
  const requestOnce: RequestOnce = async ({ target }) => {
    paths.push(target.url.pathname)
    if (target.url.pathname === '/') {
      return response(
        200,
        `<script src="/a.js"></script><script src="/b.js"></script>`,
        secureHeaders,
      )
    }
    return response(200, '', { 'content-type': 'application/javascript' })
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    fingerprintKey: Buffer.alloc(32, 1),
    limits: { maxJavaScriptAssets: 1 },
  })

  assert.equal(result.status, 'partial')
  assert.deepEqual(paths, ['/', '/robots.txt', '/a.js'])
  assert.deepEqual(result.coverage.limitsReached, ['javascript_asset_limit'])
})

test('attempts root bundles before higher-priority child bundles', async () => {
  const scriptPaths: string[] = []
  const requestOnce: RequestOnce = async ({ target }) => {
    if (target.url.pathname.endsWith('.js')) {
      scriptPaths.push(target.url.pathname)
    }
    switch (target.url.pathname) {
      case '/':
        return response(
          200,
          '<script src="/entry.js"></script><script src="/vendor.js"></script>',
          secureHeaders,
        )
      case '/entry.js':
        return response(200, "import('./admin.js')", {
          'content-type': 'application/javascript',
        })
      case '/vendor.js':
      case '/admin.js':
        return response(200, '', {
          'content-type': 'application/javascript',
        })
      default:
        return response(404, 'not found', { 'content-type': 'text/plain' })
    }
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    limits: { maxJavaScriptAssets: 2 },
  })

  assert.deepEqual(scriptPaths, ['/entry.js', '/vendor.js'])
  assert.equal(result.status, 'partial')
  assert.deepEqual(result.coverage.scripts, {
    discovered: 3,
    attempted: 2,
    scanned: 2,
  })
  assert.deepEqual(result.coverage.limitsReached, ['javascript_asset_limit'])
})

test('stops child traversal after exhausting the decoded byte budget', async () => {
  const paths: string[] = []
  const mainHtml =
    '<script src="/a.js"></script><script src="/b.js"></script>'
  const maxTotalBytes = Buffer.byteLength(mainHtml) + 5
  const requestOnce: RequestOnce = async ({ target }) => {
    paths.push(target.url.pathname)
    switch (target.url.pathname) {
      case '/':
        return response(200, mainHtml, secureHeaders)
      case '/robots.txt':
        return response(404, '', { 'content-type': 'text/plain' })
      case '/a.js':
      case '/b.js':
        return response(200, '0123456789', {
          'content-type': 'application/javascript',
        })
      default:
        return response(404, '', { 'content-type': 'text/plain' })
    }
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    limits: { maxTotalBytes },
  })

  assert.deepEqual(paths, ['/', '/robots.txt', '/a.js'])
  assert.equal(result.status, 'partial')
  assert.equal(result.coverage.bytesScanned, maxTotalBytes)
  assert.deepEqual(result.coverage.scripts, {
    discovered: 2,
    attempted: 1,
    scanned: 0,
  })
  assert.deepEqual(result.coverage.limitsReached, ['max_total_bytes'])
  assert.equal(
    result.coverage.skipped.some(
      ({ reason, count }) => reason === 'max_total_bytes' && count === 1,
    ),
    true,
  )
})

test('enforces maxDocuments independently of the route cap', async () => {
  const paths: string[] = []
  const requestOnce: RequestOnce = async ({ target }) => {
    paths.push(target.url.pathname)
    return response(
      200,
      `<a href="/about">About</a><a href="/pricing">Pricing</a>`,
      secureHeaders,
    )
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    limits: { maxDocuments: 1, maxAdditionalRoutes: 2 },
  })

  assert.deepEqual(paths, ['/'])
  assert.equal(result.status, 'partial')
  assert.deepEqual(result.coverage.limitsReached, ['document_route_limit'])
})

test('uses bounded robots and sitemap discovery to prioritize review routes', async () => {
  const paths: string[] = []
  const requestOnce: RequestOnce = async ({ target }) => {
    paths.push(target.url.pathname)
    switch (target.url.pathname) {
      case '/':
        return response(200, '<main>Application</main>', secureHeaders)
      case '/robots.txt':
        return response(
          200,
          'Allow: /pricing\nSitemap: https://app.example/sitemap.xml',
          { 'content-type': 'text/plain' },
        )
      case '/sitemap.xml':
        return response(
          200,
          '<urlset><url><loc>https://app.example/blog</loc></url><url><loc>https://app.example/dashboard</loc></url></urlset>',
          { 'content-type': 'application/xml' },
        )
      default:
        return response(200, '<main>Route</main>', secureHeaders)
    }
  }

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
  })

  assert.deepEqual(paths, [
    '/',
    '/robots.txt',
    '/sitemap.xml',
    '/dashboard',
    '/pricing',
  ])
  assert.deepEqual(result.coverage.metadata, {
    discovered: 2,
    attempted: 2,
    scanned: 2,
  })
  assert.deepEqual(result.coverage.documents, {
    discovered: 4,
    attempted: 3,
    scanned: 3,
  })
  assert.equal(result.status, 'partial')
  assert.deepEqual(result.coverage.limitsReached, ['document_route_limit'])
})

test('scores redacted findings before capping the browser response', async () => {
  const requestOnce: RequestOnce = async () => response(
    200,
    `<script>const key='${stripeSecretKey}';const routes=['/admin','/dashboard']</script>`,
    secureHeaders,
  )

  const result = await scanPublicUrl('https://app.example/', {
    resolveHost,
    requestOnce,
    fingerprintKey: Buffer.alloc(32, 1),
    limits: { maxFindings: 1 },
  })

  assert.equal(result.status, 'partial')
  assert.equal(result.findings.length, 1)
  assert.equal(result.summary.total, 2)
  assert.equal(result.score.categoryDeductions.credentials, 45)
  assert.equal(result.score.categoryDeductions.admin_surface, 8)
  assert.deepEqual(result.coverage.limitsReached, ['finding_limit'])
  assert.deepEqual(result.coverage.findings, {
    observedAtLeast: 2,
    returned: 1,
    truncated: true,
    omittedByCategory: [{ category: 'admin_surface', count: 1 }],
  })
  assert.equal(
    result.checks.find(({ id }) => id === 'admin_surface')?.status,
    'finding',
  )
})

test('never serializes credentials embedded in submitted, asset, or route paths', async () => {
  const submittedPath = `/review/${stripeSecretKey}`
  const assetPath = `/assets/${openAiSecretKey}.js`
  const requestOnce: RequestOnce = async ({ target }) => {
    if (target.url.pathname === submittedPath) {
      return response(
        200,
        `<script src="${assetPath}"></script>`,
        secureHeaders,
      )
    }
    if (target.url.pathname === assetPath) {
      return response(
        200,
        `const adminRoute='/admin/${stripeSecretKey}'`,
        { 'content-type': 'application/javascript' },
      )
    }
    return response(404, 'not found', { 'content-type': 'text/plain' })
  }

  const result = await scanPublicUrl(
    `https://app.example${submittedPath}?token=${openAiSecretKey}`,
    {
      resolveHost,
      requestOnce,
      fingerprintKey: Buffer.alloc(32, 1),
    },
  )
  const serialized = JSON.stringify(result)
  const adminFinding = result.findings.find(
    ({ ruleId }) => ruleId === 'route.admin_surface',
  )

  assert.equal(result.target.requestedUrl, 'https://app.example/')
  assert.equal(result.target.finalUrl, 'https://app.example/')
  assert.equal(adminFinding?.evidence.display, 'Administrative client route')
  assert.equal(adminFinding?.evidence.sourceUrl, 'https://app.example/')
  assert.equal(serialized.includes(stripeSecretKey), false)
  assert.equal(serialized.includes(openAiSecretKey), false)
})

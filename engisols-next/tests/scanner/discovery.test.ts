import assert from 'node:assert/strict'
import test from 'node:test'

import { discoverHtml } from '../../src/scanner/discover-html'
import { discoverJavaScript } from '../../src/scanner/discover-js'
import {
  frameworkHtml,
  frameworkJavaScript,
  viteManifest,
} from './fixtures/framework-assets'

test('discovers Next, Nuxt, and Vite assets without executing HTML', () => {
  const result = discoverHtml(
    frameworkHtml,
    new URL('https://app.example/'),
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/.vite/manifest.json',
    'https://app.example/_next/static/chunks/app/page.js',
    'https://app.example/assets/entry.js',
    'https://app.example/_nuxt/runtime.js',
    'https://app.example/assets/shared.js',
  ])
  assert.deepEqual(result.routeUrls, [
    'https://app.example/dashboard',
    'https://app.example/pricing',
  ])
  assert.deepEqual(result.importMap, {
    feature: 'https://app.example/assets/feature.js',
  })
  assert.equal(result.skipped.crossOriginScripts, 1)
  assert.equal(result.skipped.unsafeRoutes, 3)
})

test('uses Next hydration metadata to discover a build manifest and route', () => {
  const result = discoverHtml(
    `<script id="__NEXT_DATA__" type="application/json">{"buildId":"build-123","page":"/account/settings"}</script>`,
    new URL('https://app.example/'),
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/_next/static/build-123/_buildManifest.js',
  ])
  assert.deepEqual(result.routeUrls, [
    'https://app.example/account/settings',
  ])
})

test('extracts chunks from a Next build manifest with a JSON extension', () => {
  const result = discoverJavaScript(
    JSON.stringify({ '/dashboard': ['static/chunks/dashboard.js'] }),
    new URL('https://app.example/_next/static/build-123/_buildManifest.json'),
    'https://app.example',
    {},
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/_next/static/chunks/dashboard.js',
  ])
})

test('extracts script relationships from a directly referenced Vite manifest', () => {
  const result = discoverJavaScript(
    viteManifest,
    new URL('https://app.example/.vite/manifest.json'),
    'https://app.example',
    {},
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/assets/main.js',
    'https://app.example/assets/lazy.js',
    'https://app.example/assets/shared.js',
  ])
})

test('prioritizes application and review-relevant chunks over vendor code', () => {
  const result = discoverJavaScript(
    `
      import('./vendor.js')
      import('./dashboard-page.js')
      import('./runtime.js')
      import('./main.js')
      import('./misc.js')
    `,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    {},
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/assets/dashboard-page.js',
    'https://app.example/assets/main.js',
    'https://app.example/assets/runtime.js',
    'https://app.example/assets/misc.js',
    'https://app.example/assets/vendor.js',
  ])
})

test('extracts literal import graph edges and skips nonliteral or external ones', () => {
  const result = discoverJavaScript(
    frameworkJavaScript,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    { feature: 'https://app.example/assets/feature.js' },
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/assets/feature.js',
    'https://app.example/assets/lazy.js',
    'https://app.example/assets/shared.js',
    'https://app.example/assets/utility.mjs',
    'https://app.example/assets/worker.js',
  ])
  assert.equal(result.skipped.crossOriginScripts, 1)
  assert.equal(result.skipped.unresolvedSpecifiers, 0)
})

test('returns stable deduplicated URLs for cyclic candidates', () => {
  const source = `
    import('./b.js')
    import('./b.js')
    export * from './entry.js'
  `
  const first = discoverJavaScript(
    source,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    {},
  )
  const second = discoverJavaScript(
    source,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    {},
  )

  assert.deepEqual(first, second)
  assert.deepEqual(first.scriptUrls, [
    'https://app.example/assets/entry.js',
    'https://app.example/assets/b.js',
  ])
})

test('does not turn arbitrary JavaScript string literals into requests', () => {
  const result = discoverJavaScript(
    `const endpoint = '/api/export.js'; const label = '/assets/example.js'`,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    {},
  )

  assert.deepEqual(result.scriptUrls, [])
})

test('reads only documented Vite manifest graph fields', () => {
  const result = discoverJavaScript(
    JSON.stringify({
      entry: {
        file: 'assets/main.js',
        metadata: '/api/export.js',
        imports: ['shared'],
      },
      shared: { file: 'assets/shared.js' },
    }),
    new URL('https://app.example/.vite/manifest.json'),
    'https://app.example',
    {},
  )

  assert.deepEqual(result.scriptUrls, [
    'https://app.example/assets/main.js',
    'https://app.example/assets/shared.js',
  ])
})

test('bounds adversarial import graphs before queueing candidates', () => {
  const result = discoverJavaScript(
    `import('./a.js');import('./b.js');import('./c.js')`,
    new URL('https://app.example/assets/entry.js'),
    'https://app.example',
    {},
    2,
  )

  assert.equal(result.scriptUrls.length, 2)
  assert.equal(result.skipped.scriptCandidatesOmitted, 1)
})

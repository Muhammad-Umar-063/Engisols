import assert from 'node:assert/strict'
import test from 'node:test'

import {
  discoverRobots,
  discoverSitemap,
  prioritizeRouteUrls,
} from '../../src/scanner/discover-metadata'

test('discovers only same-origin sitemap and safe allow routes from robots', () => {
  const result = discoverRobots(
    `
      User-agent: *
      Allow: /pricing
      Allow: /dashboard
      Disallow: /api
      Sitemap: https://app.example/sitemap.xml
      Sitemap: https://third-party.example/sitemap.xml
    `,
    new URL('https://app.example/'),
  )

  assert.deepEqual(result.sitemapUrls, [
    'https://app.example/sitemap.xml',
  ])
  assert.deepEqual(result.routeUrls, [
    'https://app.example/dashboard',
    'https://app.example/pricing',
  ])
  assert.equal(result.skipped, 1)
})

test('bounds sitemap extraction and prioritizes review-relevant routes', () => {
  const xml = `
    <urlset>
      <url><loc>https://app.example/blog/post</loc></url>
      <url><loc>https://app.example/pricing</loc></url>
      <url><loc>https://app.example/dashboard</loc></url>
      <url><loc>https://app.example/checkout</loc></url>
      <url><loc>https://other.example/admin</loc></url>
      <url><loc>https://app.example/api/delete</loc></url>
    </urlset>
  `

  const result = discoverSitemap(xml, new URL('https://app.example/'), 4)
  assert.deepEqual(result.routeUrls, [
    'https://app.example/dashboard',
    'https://app.example/checkout',
    'https://app.example/pricing',
    'https://app.example/blog/post',
  ])
  assert.equal(result.skipped, 2)
})

test('route priority is stable regardless of discovery order', () => {
  const routes = [
    'https://app.example/blog',
    'https://app.example/settings',
    'https://app.example/pricing',
    'https://app.example/admin',
  ]

  assert.deepEqual(prioritizeRouteUrls(routes), [
    'https://app.example/admin',
    'https://app.example/settings',
    'https://app.example/pricing',
    'https://app.example/blog',
  ])
})

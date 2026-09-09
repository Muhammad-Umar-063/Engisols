export const frameworkHtml = `
  <!doctype html>
  <html>
    <head>
      <script type="module" src="/assets/entry.js"></script>
      <link rel="modulepreload" href="/assets/shared.js">
      <link rel="preload" as="script" href="/_nuxt/runtime.js">
      <link rel="preload" as="style" href="/assets/site.css">
      <link rel="manifest" href="/.vite/manifest.json">
      <script type="importmap">
        {"imports":{"feature":"/assets/feature.js"}}
      </script>
    </head>
    <body>
      <a href="/pricing">Pricing</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/logout">Log out</a>
      <a href="/api/export">Export</a>
      <a href="/settings?delete=true">Delete</a>
      <a href="https://third-party.example/app">External</a>
      <script>self.__next_f.push([1,"/_next/static/chunks/app/page.js"])</script>
      <script src="https://cdn.example/vendor.js"></script>
    </body>
  </html>
`

export const frameworkJavaScript = `
  import shared from './shared.js'
  export { utility } from '/assets/utility.mjs'
  import('feature')
  import('./lazy.js')
  new URL('./worker.js', import.meta.url)
  import(variableName)
  import('https://third-party.example/external.js')
`

export const viteManifest = `
  {
    "src/main.ts": {
      "file": "/assets/main.js",
      "imports": ["/assets/shared.js"],
      "dynamicImports": ["/assets/lazy.js"]
    }
  }
`

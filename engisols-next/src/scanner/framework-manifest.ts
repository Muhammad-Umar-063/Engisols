export type FrameworkManifestKind = 'vite' | 'next_build' | 'build'

export function frameworkManifestKind(
  pathname: string,
): FrameworkManifestKind | null {
  if (/(?:^|\/)\.vite\/manifest\.json$/i.test(pathname)) {
    return 'vite'
  }
  if (/(?:^|\/)_buildManifest\.(?:js|json)$/i.test(pathname)) {
    return 'next_build'
  }
  if (/(?:^|\/)build-manifest\.(?:js|json)$/i.test(pathname)) {
    return 'build'
  }
  return null
}

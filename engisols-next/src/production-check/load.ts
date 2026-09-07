import { getDevelopmentFixture } from './fixtures'
import { getScanStore } from './store'
import type { PersistedScan } from './types'

export async function loadScan(publicId: string): Promise<PersistedScan | null> {
  return getDevelopmentFixture(publicId) ?? getScanStore().get(publicId)
}

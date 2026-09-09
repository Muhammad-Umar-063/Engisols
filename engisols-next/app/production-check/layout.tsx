import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Cursor } from '@/components/motion/Cursor'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ProductionCheckLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="main" className="production-check-brand flex-1">{children}</main>
      <Cursor />
    </>
  )
}

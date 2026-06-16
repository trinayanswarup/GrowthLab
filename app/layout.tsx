import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'GrowthLab — Competitive Growth Intelligence',
  description: 'Find keywords your competitors win. Generate content to close the gap.',
  openGraph: {
    title: 'GrowthLab — Competitive Growth Intelligence',
    description: 'Find keywords your competitors win. Generate content to close the gap.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrowthLab — Competitive Growth Intelligence',
    description: 'Find keywords your competitors win. Generate content to close the gap.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

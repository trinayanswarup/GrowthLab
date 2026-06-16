import type { Metadata } from 'next'
import Link from 'next/link'
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

const navLinks = [
  { href: '/audit', label: 'Audit' },
  { href: '/history', label: 'History' },
  { href: '/tools', label: 'Tools' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-[#0a0a0a] text-[#ededed]">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 flex flex-col border-r border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="px-4 py-5 border-b border-[#1f1f1f]">
            <span className="text-lg font-bold tracking-tight font-mono text-[#22d3ee]">
              GrowthLab
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-2 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded text-sm text-[#a1a1aa] transition-colors hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}

'use client'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block dark:hidden" />
    </button>
  )
}

function TopNav() {
  const pathname = usePathname()
  const links = [
    { href: '/', label: 'New Report' },
    { href: '/history', label: 'History' },
    { href: '/tools', label: 'Tools' },
  ]
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="h-7 w-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight">GrowthLab</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(link => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-[var(--text-primary)] bg-[var(--surface-2)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TopNav />
      <main className="pt-14 min-h-screen bg-[var(--bg)]">
        {children}
      </main>
    </ThemeProvider>
  )
}

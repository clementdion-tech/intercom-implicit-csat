import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Implicit CSAT Dashboard',
  description: 'Real-time implicit customer satisfaction analytics for Intercom',
};

const NAV = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/languages', label: 'Languages', icon: '🌍' },
  { href: '/styles', label: 'Styles', icon: '💬' },
  { href: '/bursts', label: 'Bursts', icon: '⚡' },
  { href: '/churn', label: 'Churn Risk', icon: '🔴' },
  { href: '/conversions', label: 'Conversions', icon: '🔄' },
  { href: '/agents', label: 'Agents', icon: '👤' },
  { href: '/conversations', label: 'Conversations', icon: '📋' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
          <div className="px-4 py-5 border-b border-slate-700">
            <div className="text-white font-bold text-base leading-tight">Implicit CSAT</div>
            <div className="text-slate-400 text-xs mt-0.5">Intercom Intelligence</div>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-0.5">
            {NAV.map(item => (
              <Link key={item.href} href={item.href} className="nav-link">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-slate-700">
            <div className="text-slate-500 text-xs">Powered by Claude claude-opus-4-5</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-slate-900">
          {children}
        </main>
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Gauge, Moon, Clock, Settings, Shield } from 'lucide-react';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: Gauge },
  { href: '/app/sleep', label: 'Sleep', icon: Moon },
  { href: '/app/history', label: 'History', icon: Clock },
  { href: '/app/settings', label: 'Settings', icon: Settings },
  { href: '/app/privacy', label: 'Privacy', icon: Shield },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-db-navy text-db-text flex flex-col">
      {/* Main content area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <div className="page-enter">{children}</div>
      </main>

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06]"
        style={{
          borderRadius: '20px 20px 0 0',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(21, 26, 53, 0.85)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-200"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-colors duration-200 ${
                      active ? 'text-db-teal' : 'text-db-text-muted'
                    }`}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {/* Teal glow behind active icon */}
                  {active && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'rgba(78, 205, 196, 0.3)',
                        filter: 'blur(8px)',
                        transform: 'scale(2)',
                      }}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    active ? 'text-db-teal' : 'text-db-text-muted'
                  }`}
                >
                  {label}
                </span>
                {/* Glow dot below active item */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-db-teal"
                    style={{
                      boxShadow:
                        '0 0 6px rgba(78, 205, 196, 0.8), 0 0 12px rgba(78, 205, 196, 0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </nav>
    </div>
  );
}

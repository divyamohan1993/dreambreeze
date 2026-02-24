'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Gauge,
  Moon,
  Clock,
  Settings,
  Shield,
} from 'lucide-react';
import type { ElementType } from 'react';

interface BottomNavProps {
  currentPath: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/app', label: 'Dashboard', icon: Gauge },
  { path: '/app/sleep', label: 'Sleep', icon: Moon },
  { path: '/app/history', label: 'History', icon: Clock },
  { path: '/app/settings', label: 'Settings', icon: Settings },
  { path: '/app/privacy', label: 'Privacy', icon: Shield },
];

export default function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'rgba(10, 14, 39, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Safe area spacer for iOS */}
      <div className="flex items-center justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/app'
              ? currentPath === '/app'
              : currentPath.startsWith(path);

          return (
            <Link
              key={path}
              href={path}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] group"
            >
              {/* Active glow underneath */}
              {isActive && (
                <motion.div
                  className="absolute -top-px inset-x-2 h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #4ecdc4, transparent)',
                    boxShadow: '0 0 8px rgba(78, 205, 196, 0.4)',
                  }}
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon */}
              <motion.div
                className="relative"
                animate={{
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{
                    color: isActive ? '#4ecdc4' : '#555577',
                    transition: 'color 0.2s',
                    filter: isActive
                      ? 'drop-shadow(0 0 4px rgba(78, 205, 196, 0.4))'
                      : 'none',
                  }}
                />
              </motion.div>

              {/* Label */}
              <span
                className="text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? '#4ecdc4' : '#555577',
                  transition: 'color 0.2s',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

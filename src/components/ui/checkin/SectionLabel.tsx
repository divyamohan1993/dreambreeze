'use client';

import type { LucideIcon } from 'lucide-react';

// -- Section Header -----------------------------------------------------------

export function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-db-text-muted" />
      <span className="text-xs font-medium text-db-text-dim uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

import type { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  children: ReactNode;
}

/**
 * Settings section card. PRD Section 6.15.
 * 8px gap, 24px padding.
 */
export function SettingsCard({ title, children }: SettingsCardProps) {
  return (
    <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
      <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-amber mb-4">
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

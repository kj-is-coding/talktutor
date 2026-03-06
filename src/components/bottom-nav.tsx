'use client';

import Link from 'next/link';
import { NAV_ITEMS, useActivePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const isActive = useActivePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border md:hidden">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 px-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute -top-[9px] w-5 h-[2px] rounded-full bg-primary" />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

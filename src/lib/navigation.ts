import { Mic, BookOpen, BarChart3, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const NAV_ITEMS = [
  { href: '/app', label: 'Speak', icon: Mic },
  { href: '/app/dictionary', label: 'Dictionary', icon: BookOpen },
  { href: '/app/progress', label: 'Progress', icon: BarChart3 },
  { href: '/app/settings', label: 'Settings', icon: Settings },
] as const;

export function useActivePathname() {
  const pathname = usePathname();
  return (href: string) => {
    return pathname === href || (href === '/app' && pathname === '/app/chat');
  };
}
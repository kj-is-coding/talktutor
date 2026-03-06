# TalkTutor UI/UX Improvement Recommendations

**Date:** March 6, 2026
**Status:** Ready for Implementation

---

## Priority 1: Desktop Experience (High Impact)

### 1.1 Add Max-Width Containers to All Pages

**Current Issue:** Content stretches to full width on desktop, looking odd.

**Solution:** Wrap page content in centered containers with max-width.

```tsx
// Add to src/app/app/layout.tsx or create a PageContainer component
<main className="pb-20 md:pb-0 md:ml-[220px]">
  <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
    {children}
  </div>
</main>
```

**Pages to Update:**
- `/app/app/page.tsx` (Speak)
- `/app/app/chat/page.tsx` (Chat)
- `/app/app/dictionary/page.tsx` (Dictionary)
- `/app/app/progress/page.tsx` (Progress)
- `/app/app/settings/page.tsx` (Settings)

**Impact:** Immediately makes desktop feel intentional, not stretched.

---

### 1.2 Desktop VoiceCall: Persistent Transcript Sidebar

**Current Issue:** Transcript is bottom drawer on all devices. On desktop, this wastes screen space.

**Solution:** On desktop, show transcript as side panel.

```tsx
// In src/components/voice-call.tsx
<div className="flex flex-col md:flex-row h-[calc(100vh-5rem)]">
  {/* Main call area */}
  <div className="flex-1 flex flex-col">
    {/* Audio visualizer, action chips */}
  </div>

  {/* Transcript sidebar - desktop only */}
  <aside className="hidden md:block w-80 border-l border-border">
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-sm font-semibold mb-3">Transcript</h3>
      {transcript.map(...)}
    </div>
  </aside>

  {/* Bottom drawer - mobile only */}
  <div className="md:hidden border-t border-border">
    {/* Existing mobile drawer */}
  </div>
</div>
```

**Impact:** Desktop users see real-time transcript without obscuring call UI.

---

### 1.3 Convert Scenario Picker to Desktop Dialog

**Current Issue:** Bottom sheet slides up from bottom even on desktop.

**Solution:** Use centered dialog on desktop.

```tsx
// In src/components/voice-call.tsx scenario picker
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="w-full max-w-md bg-[#1a1a1c] rounded-2xl p-6 animate-in fade-in duration-200">
    {/* Scenario grid */}
  </div>
</div>
```

Use existing `.sheet-content` CSS which already has `@media (min-width: 768px)` override for centered dialog.

**Impact:** Feels native on both platforms.

---

### 1.4 Sidebar Enhancements

**Current Issue:** Footer only shows version number. Wasted space.

**Solutions:**

**A) Add User Profile Section**
```tsx
<div className="px-5 py-4 border-t border-border">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
      <span className="text-sm font-medium text-primary">
        {user.email?.[0].toUpperCase()}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{user.email}</p>
      <p className="text-xs text-muted-foreground">Free plan</p>
    </div>
  </div>
</div>
```

**B) Add Quick Stats**
```tsx
<div className="px-5 py-3 border-t border-border">
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">Today</span>
    <span className="font-medium">{todayMinutes} min</span>
  </div>
  <div className="flex items-center justify-between text-xs mt-1">
    <span className="text-muted-foreground">Streak</span>
    <span className="font-medium text-orange-400">{streak} days</span>
  </div>
</div>
```

**Impact:** Sidebar becomes useful, not just navigation.

---

## Priority 2: Mobile Experience Refinements

### 2.1 Fix Bottom Nav Safe Area Handling

**Current Issue:** Hardcoded `pb-20` might not account for larger safe areas.

**Solution:** Use CSS variable for consistent padding.

```tsx
// In src/app/app/layout.tsx
<main className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 md:ml-[220px]">
```

Or add to globals.css:
```css
:root {
  --bottom-nav-height: 3.5rem;
}
main {
  padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
}
@media (min-width: 768px) {
  main { padding-bottom: 0; }
}
```

**Impact:** Consistent spacing across all iOS devices.

---

### 2.2 Increase Transcript Drawer Height on Mobile

**Current Issue:** `max-h-48` (192px) is quite small for reading conversation history.

**Solution:** Use larger max-height on mobile.

```tsx
<div className="max-h-[40vh] md:max-h-48 overflow-y-auto px-4 pb-4">
```

Or make it configurable with state:
```tsx
const [transcriptHeight, setTranscriptHeight] = useState<'small' | 'large'>('small');

// User can drag to expand
<div
  className="overflow-y-auto px-4 pb-4 transition-all duration-200"
  style={{ maxHeight: transcriptHeight === 'large' ? '60vh' : '40vh' }}
>
```

**Impact:** More readable transcript on mobile.

---

### 2.3 Add Pull-to-Refresh on Progress Page

**Current Issue:** No way to refresh data without reloading page.

**Solution:** Add pull-to-refresh gesture.

```tsx
// In src/app/app/progress/page.tsx
'use client';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';

export default function ProgressPage() {
  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    // Refetch progress data
  });

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Pull indicator */}
      <div className={`flex justify-center pt-4 transition-opacity ${isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>

      {/* Progress content */}
    </div>
  );
}
```

Create `src/lib/hooks/use-pull-to-refresh.ts`:
```tsx
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Implement touch drag logic
  return { isRefreshing, onRefresh: () => { ... } };
}
```

**Impact:** Natural mobile interaction for data refresh.

---

## Priority 3: Cross-Platform Code Quality

### 3.1 Extract Navigation Configuration

**Current Issue:** `navItems` duplicated in Sidebar and BottomNav.

**Solution:** Create shared module.

```tsx
// src/lib/navigation.ts
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
```

**Usage:**
```tsx
// src/components/sidebar.tsx
import { NAV_ITEMS, useActivePathname } from '@/lib/navigation';

export function Sidebar() {
  const isActive = useActivePathname();
  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} className={isActive(item.href) ? 'active' : ''}>
          {/* ... */}
        </Link>
      ))}
    </nav>
  );
}
```

**Impact:** Single source of truth, easier to maintain.

---

### 3.2 Fix Language Switcher

**Current Issue:** Button exists but is non-functional.

**Solution:** Add dropdown functionality.

```tsx
// In src/app/app/page.tsx
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
];

// Add state
const [showLangDropdown, setShowLangDropdown] = useState(false);

// Replace language switcher
<div className="flex justify-center mb-8 relative">
  <button
    onClick={() => setShowLangDropdown(!showLangDropdown)}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
  >
    <span className="text-lg font-medium">{language}</span>
    <ChevronDown className={cn('w-4 h-4 text-white/60 transition-transform', showLangDropdown && 'rotate-180')} />
  </button>

  {showLangDropdown && (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[200px] z-50">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            setLanguage(lang.name);
            setShowLangDropdown(false);
            // Update user preferences
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors',
            language === lang.name && 'bg-accent'
          )}
        >
          <span className="text-xl">{lang.flag}</span>
          <span className="text-sm font-medium">{lang.name}</span>
        </button>
      ))}
    </div>
  )}
</div>
```

**Also need to update `getUserPreferences` to save language.**

**Impact:** Functional, users can switch languages.

---

### 3.3 Add Loading States

**Current Issue:** Some pages show content immediately during data fetch.

**Solution:** Add skeleton loaders.

```tsx
// Create src/components/ui/skeleton.tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('skeleton rounded-md animate-pulse', className)} {...props} />
  );
}

// In src/app/app/progress/page.tsx
{loading ? (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  // Actual content
)}
```

**Impact:** Better perceived performance, clearer UX.

---

## Priority 4: Visual Polish & Delight

### 4.1 Daily Goal Completion Celebration

**Current Issue:** No visual feedback when completing daily goal.

**Solution:** Add celebration animation.

```tsx
// In src/app/app/page.tsx
import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Confetti from 'react-confetti'; // or custom implementation

const [showCelebration, setShowCelebration] = useState(false);
const wasComplete = useRef(false);

useEffect(() => {
  if (progressPercent >= 100 && !wasComplete.current) {
    setShowCelebration(true);
    wasComplete.current = true;
    setTimeout(() => setShowCelebration(false), 3000);
  }
}, [progressPercent]);

// In render
{showCelebration && (
  <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
    <div className="animate-in zoom-in duration-300">
      <div className="bg-green-500/20 border-2 border-green-500 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-green-400">Goal Complete!</h2>
        <p className="text-white/60 mt-1">Great work today!</p>
      </div>
    </div>
  </div>
)}
```

**Impact:** Gamification, positive reinforcement.

---

### 4.2 Streak Fire Animation

**Current Issue:** Static flame icon.

**Solution:** Add subtle animation to streak display.

```tsx
// Add to globals.css
@keyframes flicker {
  0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
  25% { transform: scale(1.05) rotate(1deg); opacity: 0.9; }
  50% { transform: scale(1.02) rotate(-1deg); opacity: 1; }
  75% { transform: scale(1.08) rotate(2deg); opacity: 0.95; }
}

.streak-flame {
  animation: flicker 0.5s ease-in-out infinite;
}

// In component
<Flame className={cn('w-5 h-5 text-orange-400', streak > 0 && 'streak-flame')} />
```

**Impact:** Streaks feel more rewarding.

---

### 4.3 Improved Empty States

**Current Issue:** Dictionary and progress pages may have empty states with minimal guidance.

**Solution:** Create engaging empty state component.

```tsx
// src/components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium">
          {action.label}
        </button>
      )}
    </div>
  );
}

// Usage in dictionary
<EmptyState
  icon={<BookOpen className="w-8 h-8" />}
  title="No words yet"
  description="Start a voice call to build your vocabulary. New words will appear here."
  action={{ label: 'Start Practice', onClick: () => router.push('/app') }}
/>
```

**Impact:** Better onboarding, clearer CTAs.

---

## Priority 5: Accessibility Improvements

### 5.1 Add Skip to Content Link

**Solution:** Add visible-on-focus skip link.

```tsx
// In src/app/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
>
  Skip to main content
</a>
<main id="main-content">
  {children}
</main>
```

Add to globals.css:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

### 5.2 Add ARIA Labels to Icon-Only Buttons

```tsx
// Examples
<button aria-label="Start voice call">
  <Mic />
</button>

<button aria-label="Open transcript">
  <ChevronDown />
</button>
```

---

### 5.3 Improve Focus States

```tsx
// In globals.css, enhance existing focus styles
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

button:focus-visible:not(:disabled) {
  transform: scale(1.02); /* Subtle scale instead of active scale */
}
```

---

## Implementation Priority Order

1. **Week 1:** Max-width containers, Navigation extraction, Language switcher
2. **Week 2:** Desktop VoiceCall sidebar, Scenario dialog, Sidebar enhancements
3. **Week 3:** Mobile refinements (safe area, transcript height, pull-to-refresh)
4. **Week 4:** Loading states, Empty states, Celebrations
5. **Week 5:** Accessibility improvements

---

## Quick Wins (Can be done in 1-2 hours each)

1. Add max-width container to layout
2. Extract nav items to shared file
3. Add ARIA labels to icon buttons
4. Increase transcript drawer height
5. Add streak flame animation
6. Fix language switcher dropdown
7. Add skeleton loader component
8. Create empty state component

---

## Resources & References

- Tailwind Responsive Design: https://tailwindcss.com/docs/responsive-design
- shadcn/ui Patterns: https://ui.shadcn.com/
- OKLCH Color Picker: https://oklch.com/
- Mobile First Design: https://www.lukew.com/ff/entry.asp?933

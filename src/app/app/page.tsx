'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Flame, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SCENARIOS } from '@/lib/types';
import { VoiceCall } from '@/components/voice-call';
import { createClient } from '@/lib/auth-client';
import { getTodayProgress, getStreakInfo, getUserPreferences } from '@/lib/db-operations';

const DEFAULT_LANGUAGE = 'Spanish';
const DEFAULT_GOAL_MINUTES = 10;

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

function getProgressColor(percent: number) {
  if (percent >= 100) return 'from-green-500 to-emerald-400';
  if (percent >= 75) return 'from-blue-500 to-indigo-500';
  if (percent >= 50) return 'from-indigo-500 to-purple-500';
  return 'from-purple-500 to-pink-500';
}

export default function SpeakPage() {
  const router = useRouter();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [inCall, setInCall] = useState(false);
  const [callScenario, setCallScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOAL_MINUTES);
  const [streak, setStreak] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const celebratedRef = useRef(false);
  const progressPercent = Math.min(100, (todayMinutes / dailyGoal) * 100);
  const progressColor = getProgressColor(progressPercent);
  const currentLang = LANGUAGES.find(l => l.name === language) || LANGUAGES[0];

  useEffect(() => {
    async function fetchProgress() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const [progress, streakInfo, prefs] = await Promise.all([
            getTodayProgress(user.id, language),
            getStreakInfo(user.id, language),
            getUserPreferences(user.id),
          ]);

          if (progress) {
            setTodayMinutes(Math.floor(progress.secondsSpoken / 60));
          }
          if (streakInfo) {
            setStreak(streakInfo.current);
          }
          if (prefs) {
            setDailyGoal(prefs.dailyGoalMinutes);
            if (prefs.language) setLanguage(prefs.language);
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [language]);

  useEffect(() => {
    if (progressPercent >= 100 && !celebratedRef.current) {
      setShowCelebration(true);
      celebratedRef.current = true;
      createConfetti();
      setTimeout(() => setShowCelebration(false), 3500);
    }
  }, [progressPercent]);

  const createConfetti = () => {
    const colors = ['#6366f1', '#f472b6', '#fbbf24', '#34d399', '#f97316'];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'fixed pointer-events-none z-50';
        confetti.style.cssText = `
          left: ${Math.random() * 100}vw;
          top: -20px;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
      }, i * 30);
    }
  };

  const handleStartCall = (scenario?: string | null) => {
    setCallScenario(scenario || null);
    setInCall(true);
  };

  const handleCallEnd = (data: {
    durationSeconds: number;
    transcript: Array<{ role: string; content: string; timestamp: string; correction?: any }>;
    corrections: any[];
    newWords: Array<{ term: string; meaning?: string }>;
    scenario?: string;
  }) => {
    setInCall(false);
    const newMinutes = Math.floor(data.durationSeconds / 60);
    setTodayMinutes(prev => prev + newMinutes);

    const params = new URLSearchParams({
      duration: data.durationSeconds.toString(),
      words: data.newWords.length.toString(),
      scenario: data.scenario || callScenario || '',
    });

    router.push(`/app/recap?${params.toString()}`);
  };

  if (inCall) {
    return <VoiceCall onEnd={handleCallEnd} />;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col relative">
      {/* Goal Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce shadow-lg shadow-orange-500/30">
                <span className="text-4xl">🔥</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Daily Goal Complete!
              </h2>
              <p className="text-white/60 mt-2">{streak} day streak - keep it burning!</p>
            </div>
          </div>
        </div>
      )}

      {/* Language Switcher with Flag */}
      <div className="flex justify-center mb-8 relative">
        <button
          onClick={() => setShowLangDropdown(!showLangDropdown)}
          className="group relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all hover:scale-105"
          aria-label="Select language"
          aria-expanded={showLangDropdown}
        >
          <span className="text-2xl">{currentLang.flag}</span>
          <span className="text-base font-medium">{language}</span>
          <ChevronDown className={cn('w-4 h-4 text-white/60 transition-transform', showLangDropdown && 'rotate-180')} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        </button>

        {showLangDropdown && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.name);
                  setShowLangDropdown(false);
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

      {/* Today's Progress Card */}
      <div className="bg-white/5 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Today</h2>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 text-orange-400 streak-container">
              <Flame className={cn('w-5 h-5', streak > 0 && 'streak-flame')} />
              <span className="font-medium">{streak}</span>
            </div>
          )}
        </div>

        {/* Progress Bar with Gradient Color */}
        <div className="mb-2">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                progressColor,
                progressPercent >= 100 && "animate-pulse"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-white/60 text-center">
          {todayMinutes} / {dailyGoal} min today
        </p>
      </div>

      {/* Start Call Button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={() => handleStartCall(callScenario)}
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-blue-500 to-purple-600',
            'shadow-lg shadow-purple-500/30',
            'hover:scale-105 active:scale-95 transition-transform',
            'focus:outline-none focus:ring-4 focus:ring-purple-500/50'
          )}
          aria-label="Start voice call"
        >
          <Mic className="w-14 h-14 text-white" />
        </button>
        <p className="text-lg font-medium">Start Call</p>
      </div>

      {/* Scenario Picker Link */}
      <div className="mt-auto pt-6">
        <button
          onClick={() => router.push('/app/scenarios')}
          className="w-full py-3 text-center text-white/60 hover:text-white/80 transition-colors"
        >
          Pick a scenario →
        </button>
      </div>
    </div>
  );
}

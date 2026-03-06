'use client';

import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Calendar, Trophy, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/auth-client';
import { getWeeklyProgress, getStreakInfo, getUserPreferences } from '@/lib/db-operations';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyProgress, StreakInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

const mockWeeklyData: DailyProgress[] = [
  { id: '1', userId: 'demo', language: 'Spanish', date: '2026-03-04', secondsSpoken: 420, newWordsCount: 8, createdAt: new Date() },
  { id: '2', userId: 'demo', language: 'Spanish', date: '2026-03-03', secondsSpoken: 300, newWordsCount: 5, createdAt: new Date() },
  { id: '3', userId: 'demo', language: 'Spanish', date: '2026-03-02', secondsSpoken: 600, newWordsCount: 12, createdAt: new Date() },
  { id: '4', userId: 'demo', language: 'Spanish', date: '2026-03-01', secondsSpoken: 180, newWordsCount: 3, createdAt: new Date() },
  { id: '5', userId: 'demo', language: 'Spanish', date: '2026-02-28', secondsSpoken: 480, newWordsCount: 9, createdAt: new Date() },
  { id: '6', userId: 'demo', language: 'Spanish', date: '2026-02-27', secondsSpoken: 360, newWordsCount: 6, createdAt: new Date() },
  { id: '7', userId: 'demo', language: 'Spanish', date: '2026-02-26', secondsSpoken: 240, newWordsCount: 4, createdAt: new Date() },
];

interface Achievement {
  id: string;
  icon: string;
  label: string;
  status: 'locked' | 'progress' | 'unlocked';
  progress?: number;
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<DailyProgress[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({ current: 0, best: 0 });
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(10);

  const achievements: Achievement[] = [
    {
      id: 'first-call',
      icon: '🎙️',
      label: 'First Call',
      status: weeklyData.length > 0 ? 'unlocked' : 'locked'
    },
    {
      id: 'streak-3',
      icon: '🔥',
      label: '3-Day Streak',
      status: streakInfo.current >= 3 ? 'unlocked' : streakInfo.current >= 1 ? 'progress' : 'locked',
      progress: Math.min(100, (streakInfo.current / 3) * 100)
    },
    {
      id: 'words-50',
      icon: '📚',
      label: '50 Words',
      status: weeklyData.reduce((sum, d) => sum + d.newWordsCount, 0) >= 50 ? 'unlocked' : 'progress',
      progress: Math.min(100, (weeklyData.reduce((sum, d) => sum + d.newWordsCount, 0) / 50) * 100)
    },
    {
      id: 'streak-7',
      icon: '💎',
      label: '7-Day Streak',
      status: streakInfo.current >= 7 ? 'unlocked' : streakInfo.current >= 3 ? 'progress' : 'locked',
      progress: Math.min(100, (streakInfo.current / 7) * 100)
    },
    {
      id: 'week-100',
      icon: '⭐',
      label: '100 Min Week',
      status: Math.round(weeklyData.reduce((sum, d) => sum + d.secondsSpoken, 0) / 60) >= 100 ? 'unlocked' : 'progress',
      progress: Math.min(100, (Math.round(weeklyData.reduce((sum, d) => sum + d.secondsSpoken, 0) / 60) / 100) * 100)
    },
    {
      id: 'words-100',
      icon: '🏆',
      label: '100 Words',
      status: weeklyData.reduce((sum, d) => sum + d.newWordsCount, 0) >= 100 ? 'unlocked' : 'progress',
      progress: Math.min(100, (weeklyData.reduce((sum, d) => sum + d.newWordsCount, 0) / 100) * 100)
    },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const language = 'Spanish';

        if (user) {
          const [weekly, streak, prefs] = await Promise.all([
            getWeeklyProgress(user.id, language),
            getStreakInfo(user.id, language),
            getUserPreferences(user.id),
          ]);
          setWeeklyData(weekly.length > 0 ? weekly : mockWeeklyData);
          setStreakInfo(streak);
          if (prefs?.dailyGoalMinutes) setDailyGoalMinutes(prefs.dailyGoalMinutes);
        } else {
          setWeeklyData(mockWeeklyData);
          setStreakInfo({ current: 3, best: 7 });
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setWeeklyData(mockWeeklyData);
        setStreakInfo({ current: 0, best: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const todayData = weeklyData.find(
    (d) => d.date === new Date().toISOString().split('T')[0]
  );
  const todayMinutes = todayData ? Math.round(todayData.secondsSpoken / 60) : 0;
  const weekTotalMinutes = Math.round(weeklyData.reduce((sum, d) => sum + d.secondsSpoken, 0) / 60);
  const weekTotalWords = weeklyData.reduce((sum, d) => sum + d.newWordsCount, 0);
  const progressPercent = Math.min(100, (todayMinutes / dailyGoalMinutes) * 100);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxMinutes = Math.max(...weeklyData.map(d => d.secondsSpoken / 60), 15);

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Progress</h1>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Today's Progress */}
          <div className="bg-accent rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">Today</span>
              </div>
              {streakInfo.current > 0 && (
                <div className="flex items-center gap-1 text-warning streak-container">
                  <Flame className={cn('w-4 h-4', streakInfo.current > 0 && 'streak-flame')} />
                  <span className="text-[13px] font-semibold tabular-nums">{streakInfo.current} day streak</span>
                </div>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-muted-foreground">Daily Goal</span>
                <span className="text-[13px] font-medium tabular-nums">{todayMinutes} / {dailyGoalMinutes} min</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-out",
                    progressPercent >= 100 ? "from-green-500 to-emerald-400 animate-pulse" :
                    progressPercent >= 75 ? "from-blue-500 to-indigo-500" :
                    progressPercent >= 50 ? "from-indigo-500 to-purple-500" :
                    "from-purple-500 to-pink-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {todayMinutes >= dailyGoalMinutes && (
              <div className="flex items-center gap-1.5 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[13px] font-medium">Goal reached! 🎉</span>
              </div>
            )}
          </div>

          {/* Weekly Chart */}
          <div className="bg-accent rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[15px] font-medium">This Week</p>
              <span className="text-[13px] text-muted-foreground tabular-nums">{weekTotalMinutes} min</span>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-24 mb-2">
              {weeklyData.map((day, i) => {
                const minutes = Math.round(day.secondsSpoken / 60);
                const height = maxMinutes > 0 ? Math.max((minutes / maxMinutes) * 100, 4) : 4;
                const dayIndex = new Date(day.date).getDay();
                const isToday = day.date === new Date().toISOString().split('T')[0];

                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
                    <div className="w-full flex items-end justify-center relative" style={{ height: '100%' }}>
                      <div
                        className={cn(
                          "w-full max-w-[28px] rounded transition-all duration-300",
                          isToday
                            ? "bg-gradient-to-t from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                            : "bg-border group-hover:bg-primary/30"
                        )}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px]",
                      isToday ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {dayNames[dayIndex]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">Words Learned</p>
                <p className="text-lg font-semibold tabular-nums text-primary">{weekTotalWords}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">Best Streak</p>
                <p className="text-lg font-semibold tabular-nums text-warning">{streakInfo.best} days</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-accent rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-warning" />
              <p className="text-[15px] font-medium">Achievements</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative rounded-lg p-3 text-center overflow-hidden transition-all duration-300",
                    achievement.status === 'unlocked'
                      ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 achievement-shine"
                      : achievement.status === 'progress'
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary/50 opacity-60"
                  )}
                >
                  {achievement.status === 'unlocked' && (
                    <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
                  )}

                  <div className={cn(
                    "w-8 h-8 mx-auto mb-1.5 rounded-full flex items-center justify-center text-[15px] relative z-10 transition-all",
                    achievement.status === 'unlocked'
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30"
                      : achievement.status === 'progress'
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {achievement.status === 'unlocked' ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      achievement.icon
                    )}
                  </div>

                  <p className={cn(
                    "text-[11px] font-medium relative z-10",
                    achievement.status === 'unlocked' && "text-amber-400"
                  )}>
                    {achievement.label}
                  </p>

                  {achievement.status === 'progress' && achievement.progress !== undefined && (
                    <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

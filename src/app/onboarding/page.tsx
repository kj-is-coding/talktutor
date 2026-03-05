'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LANGUAGES, LEVELS } from '@/lib/types';
import { createClient } from '@/lib/auth-client';
import { upsertUserPreferences } from '@/lib/db-operations';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [language, setLanguage] = useState<string>(() => LANGUAGES[0]?.code || 'spanish');
  const [level, setLevel] = useState('intermediate');
  const [dialect, setDialect] = useState('');
  const [dailyGoal, setDailyGoal] = useState(10);

  const selectedLanguage = LANGUAGES.find((l) => l.code === language);

  const handleSkip = () => {
    router.push('/app');
  };

  const handleSubmit = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await upsertUserPreferences(user.id, {
          language: selectedLanguage?.name || 'Spanish',
          level: level as 'beginner' | 'intermediate' | 'advanced',
          dialect: dialect || selectedLanguage?.dialects?.[0],
          dailyGoalMinutes: dailyGoal,
        });
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
    router.push('/app');
  };

  const steps = [
    {
      title: "What language?",
      subtitle: "Pick the language you want to practice",
      content: (
        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              data-selected={language === lang.code}
              className="selection-card flex items-center justify-between"
            >
              <span className="font-medium text-[15px]">{lang.name}</span>
              {language === lang.code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Your level?",
      subtitle: "This helps us adapt the conversation",
      content: (
        <div className="space-y-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.code}
              onClick={() => setLevel(lvl.code)}
              data-selected={level === lvl.code}
              className="selection-card flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium text-[15px]">{lvl.name}</p>
                <p className="text-[13px] text-muted-foreground">{lvl.description}</p>
              </div>
              {level === lvl.code && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Dialect preference",
      subtitle: "Optional — helps with pronunciation",
      content: (
        <div className="space-y-2">
          {(selectedLanguage?.dialects || ['Standard']).map((d) => (
            <button
              key={d}
              onClick={() => setDialect(d)}
              data-selected={dialect === d}
              className="selection-card flex items-center justify-between"
            >
              <span className="font-medium text-[15px]">{d}</span>
              {dialect === d && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Daily goal",
      subtitle: "How much practice per day?",
      content: (
        <div className="space-y-2">
          {[5, 10, 15, 20, 30].map((mins) => (
            <button
              key={mins}
              onClick={() => setDailyGoal(mins)}
              data-selected={dailyGoal === mins}
              className="selection-card flex items-center justify-between"
            >
              <span className="font-medium text-[15px]">{mins} minutes</span>
              {dailyGoal === mins && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-dvh bg-background px-5 py-6 flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-center gap-1.5 mb-10">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              i < step ? 'w-8 bg-primary' : i === step - 1 ? 'w-8 bg-primary' : 'w-8 bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1">
        <div className="space-y-6 animate-in" key={step}>
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{currentStep.title}</h1>
            <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
          </div>
          {currentStep.content}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-6">
        {step < 4 ? (
          <>
            <Button
              onClick={() => setStep(step + 1)}
              className="w-full h-12 rounded-xl text-[15px] font-medium"
            >
              Continue
            </Button>
            <button
              onClick={handleSkip}
              className="w-full py-2.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Skip for now
            </button>
          </>
        ) : (
          <Button
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl text-[15px] font-medium"
          >
            Start speaking
          </Button>
        )}
      </div>
    </div>
  );
}

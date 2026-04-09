'use client';

import { useState } from 'react';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const STEPS = [
  {
    target: 'timer',
    title: 'Your Focus Timer',
    description: 'This is your focus timer. Set your intention and press play to start.',
  },
  {
    target: 'intent',
    title: 'Set Your Intention',
    description: 'Tell us what you\'re working on. This helps you track your focus over time.',
  },
  {
    target: 'sidebar',
    title: 'Track Your Progress',
    description: 'Track your daily progress and build a streak. Consistency is key.',
  },
];

/**
 * Onboarding overlay. PRD Section 13.
 * 3-step spotlight. Shown ONCE (tracked in user record).
 */
export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];

  if (!currentStep) return null;

  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
        <div className="bg-bg-card border border-amber/30 rounded-xl p-5 shadow-2xl">
          <p className="text-xs text-amber font-mono uppercase tracking-wider mb-1">
            Step {step + 1} of {STEPS.length}
          </p>
          <h3 className="text-surface-100 font-semibold mb-1">{currentStep.title}</h3>
          <p className="text-surface-400 text-sm mb-4">{currentStep.description}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onComplete}
              className="px-3 py-1.5 text-xs text-surface-500 hover:text-surface-300"
            >
              Skip All
            </button>
            <button
              onClick={() => {
                if (isLast) {
                  onComplete();
                } else {
                  setStep(step + 1);
                }
              }}
              className="px-4 py-1.5 bg-amber text-white text-sm rounded-lg hover:bg-amber-light"
            >
              {isLast ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

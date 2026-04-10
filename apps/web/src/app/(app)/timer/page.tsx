'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TimerMode, UserSettings, Category } from '@becoming/shared';
import { CATEGORY_DEFAULTS } from '@becoming/shared';
import { getCycleStatus, getDailyGoalStatus } from '@becoming/shared';
import { useTimer } from '@/hooks/useTimer';
import { useAudio } from '@/hooks/useAudio';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { ModeSelector } from '@/components/timer/ModeSelector';
import { TimerRing } from '@/components/timer/TimerRing';
import { PlaybackControls } from '@/components/timer/PlaybackControls';
import { DailyGoal } from '@/components/timer/DailyGoal';
import { CycleTracker } from '@/components/timer/CycleTracker';
import { IntentInput } from '@/components/timer/IntentInput';
import { CategorySelector } from '@/components/timer/CategorySelector';
import { ConfirmModal } from '@/components/timer/ConfirmModal';
import { DailyFocusTime } from '@/components/timer/DailyFocusTime';
// Tick/ambient fully controlled by AudioSyncProvider at layout level.
// No direct tick-engine imports needed in this page.
import { useSettings } from '@/contexts/SettingsContext';
import { useData } from '@/contexts/DataProvider';

/**
 * Timer page. PRD Section 5.
 * Primary interface and default landing page.
 * Contains: mode selector, circular timer, playback controls,
 * daily goal, cycle tracker, intent/category bar.
 */
export default function TimerPage() {
  // Settings from global context — shared with Settings page, instant updates
  const { settings, updateSettings } = useSettings();
  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState(settings?.defaultCategory ?? 'General');
  const isMuted = settings?.muted ?? false;
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Session data from global DataProvider — prefetched on app init, always in memory
  const { sessions: todaySessions, refreshSessions: fetchTodaySessions, addOptimisticSession } = useData();

  // Audio — mute state controls master gain in the engine. No per-call-site checks.
  const audio = useAudio(settings, isMuted);
  const lastTickedSecondRef = useRef(-1); // For haptic dedup only

  // Mute sync handled by AudioSyncProvider at layout level

  // Timer hook
  const {
    state,
    displayTime,
    remainingSeconds,
    progress,
    isLoading,
    error,
    deviceId,
    actions,
  } = useTimer({
    showSeconds: settings?.showSeconds ?? true,
    defaultDurationMinutes: settings?.focusDuration ?? 25,
    onComplete: () => {
      const mode = state?.mode;
      if (mode === 'focus') {
        audio.playCompletion(false);
        audio.playCompletionHaptic();
      } else {
        audio.playBreakEnd();
      }
      // AudioSyncProvider handles tick/ambient stop via timer state polling.
      // No manual stopTick/stopAmbient needed here.

      // OPTIMISTIC UPDATE: add a synthetic session to the local array IMMEDIATELY
      // so the counter/progress bar/cycle dots update in the same render cycle.
      // Background fetch confirms the real data afterward.
      if (mode === 'focus' || mode === 'break' || mode === 'long_break') {
        const now = new Date();
        addOptimisticSession({
          mode: mode ?? 'focus',
          actualDuration: (state?.configuredDuration ?? 1) * 60,
        });
      }

      // Background fetch to sync with server (corrects any drift)
      fetchTodaySessions();
    },
    onTick: (remaining) => {
      // Tick SOUNDS are handled by GlobalTickEngine (lives in layout, survives all navigation).
      // This callback only handles haptics (page-local, fine to re-mount).
      const currentSecond = Math.floor(remaining);
      if (currentSecond === lastTickedSecondRef.current) return;
      lastTickedSecondRef.current = currentSecond;

      if (remaining <= 10 && remaining > 0) {
        audio.playLast10sHaptic();
      }
    },
  });

  // Tick/ambient audio: fully controlled by AudioSyncProvider at layout level.
  // No tick/ambient control in this component — settings changes apply instantly
  // regardless of which page is active, without pause/resume needed.

  // Wake Lock (PRD 6.7)
  const wakeLock = useWakeLock(
    (settings?.screenWakeLock ?? true) &&
    (state?.status === 'running' || state?.status === 'overtime'),
  );

  // BroadcastChannel for multi-tab (PRD 5.2.7)
  useBroadcast('becoming-timer', useCallback((msg) => {
    if (msg.type === 'timer_updated' || msg.type === 'session_completed') {
      window.location.reload();
    }
  }, []));

  // Keyboard shortcuts (PRD 6.6)
  const shortcutBindings = useMemo(() => ({
    ' ': () => {
      if (state?.status === 'idle') {
        handlePlay();
      } else if (state?.status === 'running') {
        actions.pause();
        audio.playPause();
      } else if (state?.status === 'paused') {
        actions.resume();
        audio.playResume();
      }
    },
    'r': () => {
      if (state?.status === 'running' || state?.status === 'paused') {
        setConfirmModal({
          isOpen: true,
          title: 'Reset timer?',
          message: `Reset to ${state?.configuredDuration}:00?`,
          onConfirm: () => { actions.reset(); setConfirmModal((m) => ({ ...m, isOpen: false })); },
        });
      }
    },
    's': () => {
      if (state?.status === 'running' || state?.status === 'paused') {
        setConfirmModal({
          isOpen: true,
          title: 'Skip session?',
          message: "Skip? Won't count toward goal.",
          onConfirm: () => { actions.skip(); setConfirmModal((m) => ({ ...m, isOpen: false })); },
        });
      }
    },
    '1': () => actions.switchMode('focus'),
    '2': () => actions.switchMode('break'),
    '3': () => actions.switchMode('long_break'),
  }), [state?.status, state?.configuredDuration, actions, audio]);

  useShortcuts(shortcutBindings, settings?.shortcutsEnabled ?? true);

  // Handlers
  const handlePlay = useCallback(async () => {
    lastTickedSecondRef.current = -1;

    await audio.ensureInitialized();

    const tickIsOn = (state?.mode === 'focus' && settings?.tickDuringFocus) ||
      (state?.mode !== 'focus' && settings?.tickDuringBreaks);
    if (!tickIsOn) {
      audio.playActivation();
    }

    // AudioSyncProvider detects timer state change via polling and starts tick/ambient
    wakeLock.acquire();
    await actions.start(state?.mode ?? 'focus', intent || null, category);
  }, [audio, wakeLock, actions, state?.mode, intent, category, settings?.tickDuringFocus, settings?.tickDuringBreaks]);

  const handlePause = useCallback(async () => {
    audio.playPause();
    // AudioSyncProvider detects paused state and stops tick/ambient
    await actions.pause();
  }, [audio, actions]);

  const handleResume = useCallback(async () => {
    audio.playResume();
    // AudioSyncProvider detects running state and resumes tick/ambient
    await actions.resume();
  }, [audio, actions]);

  const handleSkip = useCallback(() => {
    const mode = state?.mode;
    const title = mode === 'focus' ? 'Skip this session?' : mode === 'long_break' ? 'Skip long break?' : 'Skip break?';
    const message = mode === 'focus'
      ? 'No time will be logged. Counter stays the same.'
      : mode === 'long_break'
        ? "Skip long break? You'll start a new focus cycle."
        : "Skip break? You'll go straight to focus.";

    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        // AudioSyncProvider handles tick/ambient via polling
        await actions.skip();
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      },
    });
  }, [actions, audio, state?.mode]);

  const handleFinishEarly = useCallback(() => {
    // Check elapsed time — if under 10 seconds, show "too short" prompt
    const elapsed = state?.startedAt
      ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
      : 0;

    if (elapsed < 10) {
      setConfirmModal({
        isOpen: true,
        title: 'Too short to log',
        message: 'Less than 10 seconds elapsed. Skip instead?',
        onConfirm: async () => {
          // AudioSyncProvider handles tick/ambient via polling
          await actions.skip();
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        },
      });
      return;
    }

    // Log partial session + optimistic update
    const mode = state?.mode ?? 'focus';

    // Optimistic: add partial session to local state immediately
    if (mode === 'focus') {
      addOptimisticSession({
        mode: 'focus',
        actualDuration: elapsed,
      });
    }

    actions.finishEarly();
    fetchTodaySessions(); // Background sync
  }, [actions, audio, state?.startedAt, state?.mode, fetchTodaySessions]);

  const handleReset = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset timer?',
      message: `Reset to ${state?.configuredDuration ?? 25}:00?`,
      onConfirm: async () => {
        await actions.reset();
        // AudioSyncProvider handles tick/ambient via polling
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      },
    });
  }, [actions, audio, state?.configuredDuration]);

  const handleAbandon = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: 'Abandon session?',
      message: 'This session will not be logged. Are you sure?',
      variant: 'destructive',
      onConfirm: async () => {
        await actions.reset();
        // AudioSyncProvider handles tick/ambient via polling
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      },
    });
  }, [actions, audio]);

  const handleModeSwitch = useCallback((mode: TimerMode) => {
    if (state?.status === 'running' || state?.status === 'paused') {
      setConfirmModal({
        isOpen: true,
        title: 'Switch mode?',
        message: 'Switching will reset your current session. This session will not be logged. Continue?',
        onConfirm: async () => {
          await actions.switchMode(mode);
          // AudioSyncProvider handles tick/ambient via polling
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        },
      });
    }
  }, [state?.status, actions, audio]);

  // Computed values
  const categories: Category[] = settings?.categories ?? CATEGORY_DEFAULTS.INITIAL_CATEGORIES.map((c, i) => ({
    name: c.name,
    color: c.color,
    order: i,
    createdAt: new Date().toISOString(),
  }));

  const dailyGoal = getDailyGoalStatus(
    todaySessions as Parameters<typeof getDailyGoalStatus>[0],
    settings?.dailyGoal ?? 4,
    new Date().toISOString().split('T')[0] ?? '',
    settings?.minCountableSession ?? 10,
  );

  const cycleStatus = getCycleStatus(
    todaySessions as Parameters<typeof getCycleStatus>[0],
    settings?.cycleCount ?? 4,
  );

  // User is controller if: no controlling device set, OR this device is the controller,
  // OR the timer is idle/completed (no one controls an idle timer)
  const isController =
    !state?.controllingDeviceId ||
    state.controllingDeviceId === deviceId ||
    state.status === 'idle' ||
    state.status === 'completed';

  // Dynamic tab title (PRD 5.2.8)
  useEffect(() => {
    if (!settings?.tabTitleTimer) {
      document.title = 'Becoming.. | Focus Timer';
      return;
    }

    const timerStatus = state?.status ?? 'idle';
    const intent = state?.intent;
    const intentLabel = intent ? ` — ${intent}` : '';

    // No emoji prefix — the animated favicon already communicates state visually.
    // Clean text only in the tab title.
    switch (timerStatus) {
      case 'running':
        document.title = `${displayTime}${intentLabel} | Becoming..`;
        break;
      case 'paused':
        document.title = `${displayTime} — Paused | Becoming..`;
        break;
      case 'overtime':
        document.title = `${displayTime} — Overtime | Becoming..`;
        break;
      case 'completed':
        document.title = 'Done! | Becoming..';
        break;
      default:
        document.title = 'Becoming.. | Focus Timer';
    }
  }, [displayTime, state?.status, state?.intent, settings?.tabTitleTimer]);

  // Dynamic animated favicon (PRD 5.2.8)
  useDynamicFavicon({
    status: state?.status ?? 'idle',
    mode: state?.mode ?? 'focus',
    progress,
    enabled: settings?.dynamicFavicon ?? true,
  });

  // Show skeleton until BOTH timer state AND settings are loaded.
  // Without settings, useTimer gets the wrong default duration (25 instead of user's saved value).
  // This prevents the "flash of 25:00" before the real duration appears.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-[280px] h-[280px] rounded-full bg-surface-900/50 animate-pulse" />
        <div className="mt-8 h-4 w-48 bg-surface-900/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/80 border border-red-800 text-red-200 text-sm px-4 py-3 rounded-lg max-w-sm z-50">
          {error}
        </div>
      )}

      {/* Mode Selector (PRD 5.1) */}
      <ModeSelector
        activeMode={state?.mode ?? 'focus'}
        timerStatus={state?.status ?? 'idle'}
        onModeChange={(mode) => actions.switchMode(mode)}
        onConfirmSwitch={handleModeSwitch}
      />

      {/* Circular Timer Display (PRD 5.2) */}
      <TimerRing
        progress={progress}
        status={state?.status ?? 'idle'}
        mode={state?.mode ?? 'focus'}
        displayTime={displayTime}
        accentColor={settings?.accentColor ?? '#D97706'}
        breakAccentColor={settings?.breakAccentColor ?? '#0D9488'}
        reducedMotion={settings?.reducedMotion ?? false}
      />

      {/* Playback Controls (PRD 5.3) */}
      <PlaybackControls
        status={state?.status ?? 'idle'}
        isController={isController}
        strictMode={settings?.strictMode ?? false}
        isFocusMode={state?.mode === 'focus'}
        onPlay={handlePlay}
        onPause={handlePause}
        onResume={handleResume}
        onSkip={handleSkip}
        onSkipBreak={async () => {
          // Break skip: no confirmation, immediate transition to focus.
          // If break is idle (not started), use switchMode. If running/paused, use skip.
          if (state?.status === 'running' || state?.status === 'paused') {
            await actions.skip();
          } else {
            await actions.switchMode('focus');
          }
        }}
        onFinishEarly={handleFinishEarly}
        onReset={handleReset}
        onAbandon={handleAbandon}
        onStopOvertime={() => actions.stopOvertime()}
        onTakeOver={() => actions.takeOver()}
      />

      {/* Mute toggle — prominent, persistent, one source of truth */}
      <button
        onClick={async () => {
          const next = !isMuted;
          // Update via context — instant UI update, background save
          updateSettings({ muted: next });
          if (next) {
            // AudioSyncProvider handles tick/ambient via polling
          } else {
            // AudioSyncProvider reacts to muted=false and resumes tick/ambient
          }
        }}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono
          transition-all duration-200
          ${isMuted
            ? 'bg-red-950/40 text-red-400 border border-red-800/40'
            : 'bg-surface-900/60 text-surface-300 border border-surface-700 hover:text-white hover:border-surface-500'
          }
        `}
        title={isMuted ? 'Unmute all sounds' : 'Mute all sounds'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          /* Speaker with slash — muted */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          /* Speaker with waves — unmuted */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
        <span className="tracking-wider">{isMuted ? 'Muted' : 'Sound'}</span>
      </button>

      {/* Daily Goal (PRD 5.4) */}
      <DailyGoal completed={dailyGoal.completed} target={dailyGoal.target} />

      {/* Daily Focus Time — only focus sessions count */}
      <DailyFocusTime
        totalMinutes={Math.round(
          todaySessions
            .filter((s) => s.mode === 'focus' && s.status === 'completed' && !s.deletedAt)
            .reduce((sum, s) => sum + s.actualDuration, 0) / 60
        )}
        activeElapsedSeconds={
          state?.status === 'running' && state?.mode === 'focus' && state?.startedAt
            ? Math.max(0, Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000))
            : 0
        }
      />

      {/* Cycle Tracker (PRD 5.5) */}
      <CycleTracker
        cycleNumber={cycleStatus.cycleNumber}
        dots={cycleStatus.dots}
        hasAnySessions={todaySessions.length > 0}
      />

      {/* Intent + Category Bar (PRD 5.6) */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <IntentInput
          value={intent}
          onChange={(v) => {
            setIntent(v);
            actions.updateIntent(v);
          }}
          disabled={state?.status === 'running' && settings?.strictMode && state?.mode === 'focus'}
        />
        <CategorySelector
          selected={category}
          categories={categories}
          onChange={(c) => {
            setCategory(c);
            actions.updateCategory(c);
          }}
          disabled={state?.status === 'running' || state?.status === 'paused'}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
        variant={confirmModal.variant}
      />
    </div>
  );
}

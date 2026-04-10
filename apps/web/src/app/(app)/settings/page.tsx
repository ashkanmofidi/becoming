'use client';

import { useCallback, useState } from 'react';
import type { UserSettings } from '@becoming/shared';
import { LIMITS } from '@becoming/shared';
import { SettingsCard } from '@/components/settings/primitives/SettingsCard';
import { Toggle } from '@/components/settings/primitives/Toggle';
import { Stepper } from '@/components/settings/primitives/Stepper';
import { Slider } from '@/components/settings/primitives/Slider';
import { Select } from '@/components/settings/primitives/Select';
import { ColorPicker } from '@/components/settings/primitives/ColorPicker';
import { SegmentedControl } from '@/components/settings/primitives/SegmentedControl';
import { ConfirmModal } from '@/components/timer/ConfirmModal';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Settings page. PRD Section 6.
 * Uses global SettingsContext — changes apply instantly to all pages.
 * Background save happens automatically via context provider.
 */
export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInput, setClearInput] = useState('');

  const update = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    updateSettings({ [key]: value } as Partial<UserSettings>);
  }, [updateSettings]);

  if (!settings) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isSilentTheme = settings.soundTheme === 'silent';
  const isVolumeZero = settings.masterVolume === 0;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      {/* Desktop 2-col, mobile 1-col (PRD 6.15) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timer (PRD 6.1) */}
        <SettingsCard title="Timer">
          <Stepper label="Focus Duration" subtitle="Minutes per focus block" value={settings.focusDuration} onChange={(v) => update('focusDuration', v)} min={LIMITS.FOCUS_MIN} max={LIMITS.FOCUS_MAX} suffix=" min" />
          <Stepper label="Short Break" subtitle="Minutes per short break" value={settings.shortBreakDuration} onChange={(v) => update('shortBreakDuration', v)} min={LIMITS.SHORT_BREAK_MIN} max={LIMITS.SHORT_BREAK_MAX} suffix=" min" />
          <Stepper label="Long Break" subtitle="Minutes per long break" value={settings.longBreakDuration} onChange={(v) => update('longBreakDuration', v)} min={LIMITS.LONG_BREAK_MIN} max={LIMITS.LONG_BREAK_MAX} suffix=" min" />
          <Stepper label="Cycles" subtitle="Sessions before long break" value={settings.cycleCount} onChange={(v) => update('cycleCount', v)} min={LIMITS.CYCLE_MIN} max={LIMITS.CYCLE_MAX} />
          <Toggle label="Overtime Allowance" description="Timer counts up after 00:00" enabled={settings.overtimeAllowance} onChange={(v) => update('overtimeAllowance', v)} />
        </SettingsCard>

        {/* Behavior (PRD 6.2) */}
        <SettingsCard title="Behavior">
          <Toggle label="Auto-Start Breaks" description="5-second countdown after focus" enabled={settings.autoStartBreaks} onChange={(v) => update('autoStartBreaks', v)} />
          <Toggle label="Auto-Start Focus" description="Auto-start after break" enabled={settings.autoStartFocus} onChange={(v) => update('autoStartFocus', v)} />
          <Toggle label="Desktop Notifications" enabled={settings.desktopNotifications} onChange={(v) => update('desktopNotifications', v)} />
          <Stepper label="Daily Goal" subtitle="Focus sessions per day" value={settings.dailyGoal} onChange={(v) => update('dailyGoal', v)} min={LIMITS.DAILY_GOAL_MIN} max={LIMITS.DAILY_GOAL_MAX} />
          <Toggle label="Strict Mode" description="Disables pause/skip/reset during focus" enabled={settings.strictMode} onChange={(v) => update('strictMode', v)} />
          <Toggle label="Ask before logout with active timer" description="Show confirmation when logging out during a session" enabled={settings.confirmLogoutWithActiveTimer} onChange={(v) => update('confirmLogoutWithActiveTimer', v)} />
          <Select label="Streak Calculation" value={settings.streakCalculation} onChange={(v) => update('streakCalculation', v as UserSettings['streakCalculation'])} options={[
            { value: 'one_session', label: 'At least 1 session' },
            { value: 'meet_goal', label: 'Meet daily goal' },
            { value: 'open_app', label: 'Open the app' },
          ]} />
          <Stepper label="Streak Freeze" subtitle="Rest days per month" value={settings.streakFreezePerMonth} onChange={(v) => update('streakFreezePerMonth', v)} min={LIMITS.STREAK_FREEZE_MIN} max={LIMITS.STREAK_FREEZE_MAX} suffix="/mo" />
        </SettingsCard>

        {/* Display (PRD 6.3) */}
        <SettingsCard title="Display">
          <Select label="Theme" value={settings.theme} onChange={(v) => update('theme', v as UserSettings['theme'])} options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ]} />
          <SegmentedControl label="Font Size" value={settings.fontSize} onChange={(v) => update('fontSize', v as UserSettings['fontSize'])} options={[
            { value: 'small', label: '80%' },
            { value: 'normal', label: '100%' },
            { value: 'large', label: '120%' },
            { value: 'xl', label: '150%' },
          ]} />
          <ColorPicker label="Accent Color" value={settings.accentColor} onChange={(v) => update('accentColor', v)} />
          <ColorPicker label="Break Accent Color" value={settings.breakAccentColor} onChange={(v) => update('breakAccentColor', v)} />
          <Select label="Clock Font" value={settings.clockFont} onChange={(v) => update('clockFont', v as UserSettings['clockFont'])} options={[
            { value: 'flip', label: 'Flip Clock' },
            { value: 'digital', label: 'Digital' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'analog', label: 'Analog' },
          ]} disabled={settings.reducedMotion && settings.clockFont === 'flip'} />
          <Toggle label="Show Seconds" enabled={settings.showSeconds} onChange={(v) => update('showSeconds', v)} />
          <Toggle label="Reduced Motion" description="Disables all animations" enabled={settings.reducedMotion} onChange={(v) => update('reducedMotion', v)} />
          <SegmentedControl label="Completion Animation" subtitle={settings.reducedMotion ? 'Disabled by Reduced Motion' : undefined} value={settings.completionAnimationIntensity} onChange={(v) => update('completionAnimationIntensity', v as UserSettings['completionAnimationIntensity'])} disabled={settings.reducedMotion} options={[
            { value: 'subtle', label: 'Subtle' },
            { value: 'standard', label: 'Standard' },
            { value: 'celebration', label: 'Celebration' },
          ]} />
          <Toggle label="Tab Title Timer" description="Show countdown in browser tab" enabled={settings.tabTitleTimer} onChange={(v) => update('tabTitleTimer', v)} />
          <Toggle label="Dynamic Favicon" enabled={settings.dynamicFavicon} onChange={(v) => update('dynamicFavicon', v)} />
        </SettingsCard>

        {/* Sound (PRD 6.4) */}
        <SettingsCard title="Sound">
          <Toggle label="Mute All Sounds" description="Silences everything — same as the mute button on the timer" enabled={settings.muted} onChange={(v) => update('muted', v)} />
          <Select label="Sound Theme" value={settings.soundTheme} onChange={(v) => update('soundTheme', v as UserSettings['soundTheme'])} options={[
            { value: 'warm', label: 'Warm' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'nature', label: 'Nature' },
            { value: 'silent', label: 'Silent' },
          ]} />
          {isSilentTheme && (
            <p className="text-xs text-surface-500 italic">Sounds are disabled by Silent theme.</p>
          )}
          <Slider label="Master Volume" value={settings.masterVolume} onChange={(v) => update('masterVolume', v)} min={0} max={100} disabled={isSilentTheme} />
          <Toggle label="Tick During Focus" description="Soft tick every second while focusing" enabled={settings.tickDuringFocus} onChange={(v) => update('tickDuringFocus', v)} disabled={isSilentTheme || isVolumeZero} />
          {settings.tickDuringFocus && settings.ambientSound !== 'none' && (
            <p className="text-xs text-amber/70 -mt-2 ml-1">Tip: Ambient sound works best without ticking enabled</p>
          )}
          <Toggle label="Tick During Breaks" description="Soft tick every second during breaks" enabled={settings.tickDuringBreaks} onChange={(v) => update('tickDuringBreaks', v)} disabled={isSilentTheme || isVolumeZero} />
          <Toggle label="Last 30s Ticking" description="Louder tick every second in final 30 seconds" enabled={settings.last30sTicking} onChange={(v) => update('last30sTicking', v)} disabled={isSilentTheme || isVolumeZero} />
          <Toggle label="Haptic Feedback" description="Vibration on mobile" enabled={settings.hapticEnabled} onChange={(v) => update('hapticEnabled', v)} />
          <Toggle label="Respect Silent Mode" description="Suppress sounds when device is silenced" enabled={settings.respectSilentMode} onChange={(v) => update('respectSilentMode', v)} />
          <Select label="Ambient Sound" value={settings.ambientSound} onChange={(v) => update('ambientSound', v as UserSettings['ambientSound'])} options={[
            { value: 'none', label: 'None' },
            { value: 'white_noise', label: 'White Noise' },
            { value: 'brown_noise', label: 'Brown Noise' },
            { value: 'rain', label: 'Rain' },
            { value: 'coffee_shop', label: 'Coffee Shop' },
            { value: 'lofi_beats', label: 'Lo-Fi Beats' },
            { value: 'forest', label: 'Forest' },
          ]} />
          {settings.ambientSound !== 'none' && (
            <Slider label="Ambient Volume" value={settings.ambientVolume} onChange={(v) => update('ambientVolume', v)} min={0} max={100} />
          )}
        </SettingsCard>

        {/* Focus Mode (PRD 6.7) */}
        <SettingsCard title="Focus Mode">
          <Toggle label="Screen Wake Lock" description="Keep screen on during sessions" enabled={settings.screenWakeLock} onChange={(v) => update('screenWakeLock', v)} />
          <Toggle label="Fullscreen Focus" description="Enter fullscreen when timer starts" enabled={settings.fullscreenFocus} onChange={(v) => update('fullscreenFocus', v)} />
        </SettingsCard>

        {/* Streak & Goals (PRD 6.8) */}
        <SettingsCard title="Streak & Goals">
          <Toggle label="Weekly Goal" enabled={settings.weeklyGoalEnabled} onChange={(v) => update('weeklyGoalEnabled', v)} />
          {settings.weeklyGoalEnabled && (
            <Stepper label="Weekly Target" value={settings.weeklyGoalTarget} onChange={(v) => update('weeklyGoalTarget', v)} min={LIMITS.WEEKLY_GOAL_MIN} max={LIMITS.WEEKLY_GOAL_MAX} />
          )}
          <Toggle label="Milestone Celebrations" description="Badges for streaks and session milestones" enabled={settings.milestoneCelebrations} onChange={(v) => update('milestoneCelebrations', v)} />
        </SettingsCard>

        {/* Notifications (PRD 6.9) */}
        <SettingsCard title="Notifications">
          <Toggle label="Idle Reminder" description="Remind when idle too long" enabled={settings.idleReminder} onChange={(v) => update('idleReminder', v)} />
          {settings.idleReminder && (
            <Stepper label="Idle Delay" subtitle="Minutes before reminder" value={settings.idleReminderDelay} onChange={(v) => update('idleReminderDelay', v)} min={5} max={60} suffix=" min" />
          )}
          <Toggle label="Daily Summary" enabled={settings.dailySummary} onChange={(v) => update('dailySummary', v)} />
          <Toggle label="Email Notifications" enabled={settings.emailNotifications} onChange={(v) => update('emailNotifications', v)} />
        </SettingsCard>

        {/* Session & Data (PRD 6.10) */}
        <SettingsCard title="Session & Data">
          <Toggle label="Intent Autocomplete" enabled={settings.intentAutocomplete} onChange={(v) => update('intentAutocomplete', v)} />
          <Toggle label="Auto-Log Sessions" description="OFF: prompt after each session" enabled={settings.autoLogSessions} onChange={(v) => update('autoLogSessions', v)} />
          <Toggle label="Session Notes" description="Text area after each session" enabled={settings.sessionNotes} onChange={(v) => update('sessionNotes', v)} />
        </SettingsCard>

        {/* Accessibility (PRD 6.12) */}
        <SettingsCard title="Accessibility">
          <Select label="Screen Reader Verbosity" value={settings.screenReaderVerbosity} onChange={(v) => update('screenReaderVerbosity', v as UserSettings['screenReaderVerbosity'])} options={[
            { value: 'standard', label: 'Standard' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'verbose', label: 'Verbose' },
          ]} />
          <Toggle label="High Contrast" description="WCAG AAA compliance" enabled={settings.highContrast} onChange={(v) => update('highContrast', v)} />
          <Toggle label="Large Tap Targets" description="56px minimum touch targets" enabled={settings.largeTapTargets} onChange={(v) => update('largeTapTargets', v)} />
          <Select label="Color Blind Mode" value={settings.colorBlindMode} onChange={(v) => update('colorBlindMode', v as UserSettings['colorBlindMode'])} options={[
            { value: 'off', label: 'Off' },
            { value: 'deuteranopia', label: 'Deuteranopia' },
            { value: 'protanopia', label: 'Protanopia' },
            { value: 'tritanopia', label: 'Tritanopia' },
          ]} />
        </SettingsCard>

        {/* Shortcuts (PRD 6.6) */}
        <SettingsCard title="Keyboard Shortcuts">
          <Toggle label="Enable Shortcuts" enabled={settings.shortcutsEnabled} onChange={(v) => update('shortcutsEnabled', v)} />
          {settings.shortcutsEnabled && (
            <div className="space-y-2">
              {Object.entries(settings.shortcutBindings).map(([action, key]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-sm text-surface-300 capitalize">{action.replace(/_/g, ' ')}</span>
                  <kbd className="px-2 py-0.5 bg-surface-900 border border-surface-700 rounded text-xs font-mono text-surface-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </SettingsCard>

        {/* Data Management (PRD 6.11) - Full width */}
        <div className="lg:col-span-2">
          <SettingsCard title="Data Management">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  const res = await fetch('/api/sessions?format=csv');
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `becoming_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="px-4 py-3 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 hover:text-white hover:border-surface-500 transition-colors text-left"
              >
                <span className="font-medium block">Export CSV</span>
                <span className="text-xs text-surface-500">Download sessions as spreadsheet</span>
              </button>

              <button
                onClick={async () => {
                  // Fetch settings + sessions in parallel for complete backup
                  const [settingsRes, sessionsRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/sessions?type=all&limit=10000'),
                  ]);
                  const settingsData = settingsRes.ok ? await settingsRes.json() : {};
                  const sessionsData = sessionsRes.ok ? await sessionsRes.json() : {};
                  const backup = {
                    exportedAt: new Date().toISOString(),
                    settings: settingsData.settings ?? null,
                    sessions: sessionsData.sessions ?? [],
                    totalSessions: sessionsData.total ?? 0,
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `becoming_backup_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-3 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 hover:text-white hover:border-surface-500 transition-colors text-left"
              >
                <span className="font-medium block">JSON Backup</span>
                <span className="text-xs text-surface-500">Export all settings and session data</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-3 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 hover:text-white hover:border-surface-500 transition-colors text-left"
              >
                <span className="font-medium block">Reset to Factory</span>
                <span className="text-xs text-surface-500">Settings only, keeps sessions</span>
              </button>

              <button
                onClick={() => { setClearInput(''); setShowClearConfirm(true); }}
                className="px-4 py-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300 hover:text-red-200 hover:border-red-700 transition-colors text-left"
              >
                <span className="font-medium block">Clear All Data</span>
                <span className="text-xs text-red-400/70">Deletes sessions and resets settings from our servers</span>
              </button>
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* Reset to Factory modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset to Factory Defaults"
        message="This will reset all settings to their defaults. Your sessions will be kept."
        confirmLabel="Reset"
        onConfirm={() => {
          setShowResetConfirm(false);
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: null, reset: true }),
          }).then(() => window.location.reload());
        }}
        onCancel={() => setShowResetConfirm(false)}
        variant="destructive"
      />

      {/* Clear All Data modal — two-step confirmation with typed input */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title">
            <h3 id="clear-dialog-title" className="text-white font-semibold mb-2">Clear All Data</h3>
            <p className="text-surface-300 text-sm mb-4">
              This will <strong className="text-red-400">permanently delete ALL your data</strong> including sessions, settings, and history. This cannot be undone. Type <strong className="text-red-400">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={clearInput}
              onChange={(e) => setClearInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 mb-4 bg-surface-900 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:border-red-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-surface-300 border border-surface-700 rounded-lg hover:bg-surface-900 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={clearInput !== 'DELETE'}
                onClick={async () => {
                  setShowClearConfirm(false);
                  // Delete ALL user data: sessions, settings, timer state
                  await fetch('/api/sessions', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clearAll: true }),
                  });
                  // Log out and redirect to login
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

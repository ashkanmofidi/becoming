import { sessionRepo } from '../repositories/session.repo';
import { settingsRepo } from '../repositories/settings.repo';
import type { SessionRecord } from '@becoming/shared';
import { getCurrentDay, calculateGoalRate, calculateStreak } from '@becoming/shared';
/**
 * Dashboard service. PRD Section 7.
 * Server-side computation. < 1 second load. 30-second poll.
 */
export const dashboardService = {
  /**
   * Get all dashboard data for a user.
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    // Parallel fetch: settings + sessions are independent
    const [settings, allSessions] = await Promise.all([
      settingsRepo.get(userId),
      sessionRepo.findByUser(userId, { offset: 0, limit: 10000 }),
    ]);
    const completed = allSessions.filter((s) => s.status === 'completed' && s.deletedAt === null);
    const focusSessions = completed.filter((s) => s.mode === 'focus');

    const today = getCurrentDay(settings.dayResetTime, settings.dayResetTimezone);

    // Top stats (PRD 7.1)
    const focusToday = focusSessions.filter((s) => s.date === today).length;
    const allTimeCount = focusSessions.length;
    const totalHours = Math.round(focusSessions.reduce((sum, s) => sum + s.actualDuration, 0) / 3600 * 10) / 10;

    // Goal rate (PRD 7.1)
    const daysWithSessions = new Set(focusSessions.map((s) => s.date));
    const daysMetGoal = [...daysWithSessions].filter((date) => {
      const count = focusSessions.filter((s) => s.date === date).length;
      return count >= settings.dailyGoal;
    }).length;
    const goalRate = calculateGoalRate(daysMetGoal, daysWithSessions.size);

    // Streak
    const streakResult = calculateStreak(
      completed,
      settings,
      settings.dayResetTime,
      settings.dayResetTimezone,
      today,
      0,
      settings.streakFreezePerMonth,
    );

    // Focus hours by day (PRD 7.2)
    const focusHoursByDay = this.aggregateFocusHours(focusSessions, 7);
    const focusHours30d = this.aggregateFocusHours(focusSessions, 30);

    // Category breakdown (PRD 7.3)
    const categoryBreakdown = this.getCategoryBreakdown(focusSessions);

    // Activity heatmap (PRD 7.4)
    const heatmap = this.getHeatmapData(focusSessions, 28);

    // Top intents (PRD 7.5)
    const topIntents = this.getTopIntents(focusSessions, 10);

    // Peak hours (PRD 7.6)
    const peakHours = this.getPeakHours(focusSessions);

    // Weekly comparison (PRD 7.7)
    const weeklyComparison = this.getWeeklyComparison(focusSessions, today, settings.dailyGoal);

    return {
      stats: {
        focusToday,
        allTimeCount,
        totalHours,
        goalRate,
        streak: streakResult.current,
        streakStart: streakResult.startDate,
        longestStreak: streakResult.longest,
      },
      focusHoursByDay,
      focusHours30d,
      categoryBreakdown,
      heatmap,
      topIntents,
      peakHours,
      weeklyComparison,
      dailyGoal: settings.dailyGoal,
    };
  },

  aggregateFocusHours(sessions: SessionRecord[], days: number): Array<{ date: string; hours: number; sessions: number; goalMet?: boolean }> {
    const now = new Date();
    const result: Array<{ date: string; hours: number; sessions: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] ?? '';
      const daySessions = sessions.filter((s) => s.date === dateStr);
      const hours = Math.round(daySessions.reduce((sum, s) => sum + s.actualDuration, 0) / 3600 * 100) / 100;
      result.push({ date: dateStr, hours, sessions: daySessions.length });
    }

    return result;
  },

  getCategoryBreakdown(sessions: SessionRecord[]): Array<{ category: string; count: number; totalMinutes: number; percentage: number }> {
    const map = new Map<string, { count: number; totalMinutes: number }>();

    for (const s of sessions) {
      const entry = map.get(s.category) ?? { count: 0, totalMinutes: 0 };
      entry.count++;
      entry.totalMinutes += Math.round(s.actualDuration / 60);
      map.set(s.category, entry);
    }

    const total = sessions.length || 1;
    return [...map.entries()]
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalMinutes: data.totalMinutes,
        percentage: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  },

  getHeatmapData(sessions: SessionRecord[], days: number): Array<{ date: string; count: number; level: number }> {
    const now = new Date();
    const result: Array<{ date: string; count: number; level: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] ?? '';
      const count = sessions.filter((s) => s.date === dateStr).length;
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4;
      result.push({ date: dateStr, count, level });
    }

    return result;
  },

  getTopIntents(sessions: SessionRecord[], limit: number): Array<{ intent: string; count: number; totalMinutes: number }> {
    const map = new Map<string, { count: number; totalMinutes: number }>();

    for (const s of sessions) {
      if (!s.intent) continue;
      const entry = map.get(s.intent) ?? { count: 0, totalMinutes: 0 };
      entry.count++;
      entry.totalMinutes += Math.round(s.actualDuration / 60);
      map.set(s.intent, entry);
    }

    return [...map.entries()]
      .filter(([, data]) => data.count > 1)
      .map(([intent, data]) => ({ intent, count: data.count, totalMinutes: data.totalMinutes }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  getPeakHours(sessions: SessionRecord[]): number[][] {
    // 7 days x 24 hours heatmap (PRD 7.6)
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const s of sessions) {
      const date = new Date(s.startedAt);
      const day = date.getDay(); // 0=Sun
      const hour = date.getHours();
      grid[day]![hour]!++;
    }

    return grid;
  },

  getWeeklyComparison(
    sessions: SessionRecord[],
    today: string,
    dailyGoal: number,
  ): { thisWeek: WeekStats; lastWeek: WeekStats } {
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay();

    const thisWeekStart = new Date(todayDate);
    thisWeekStart.setDate(todayDate.getDate() - dayOfWeek);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const thisWeekStr = thisWeekStart.toISOString().split('T')[0] ?? '';
    const lastWeekStr = lastWeekStart.toISOString().split('T')[0] ?? '';

    const thisWeekSessions = sessions.filter((s) => s.date >= thisWeekStr && s.date < today);
    const lastWeekSessions = sessions.filter((s) => s.date >= lastWeekStr && s.date < thisWeekStr);

    const calcStats = (ss: SessionRecord[]): WeekStats => ({
      sessions: ss.length,
      totalMinutes: Math.round(ss.reduce((sum, s) => sum + s.actualDuration, 0) / 60),
      avgDuration: ss.length > 0 ? Math.round(ss.reduce((sum, s) => sum + s.actualDuration, 0) / ss.length / 60) : 0,
      goalDays: new Set([...new Set(ss.map((s) => s.date))].filter((d) => ss.filter((s) => s.date === d).length >= dailyGoal)).size,
    });

    return { thisWeek: calcStats(thisWeekSessions), lastWeek: calcStats(lastWeekSessions) };
  },
};

interface WeekStats {
  sessions: number;
  totalMinutes: number;
  avgDuration: number;
  goalDays: number;
}

export interface DashboardData {
  stats: {
    focusToday: number;
    allTimeCount: number;
    totalHours: number;
    goalRate: number | null;
    streak: number;
    streakStart: string | null;
    longestStreak: number;
  };
  focusHoursByDay: Array<{ date: string; hours: number; sessions: number }>;
  focusHours30d: Array<{ date: string; hours: number; sessions: number }>;
  categoryBreakdown: Array<{ category: string; count: number; totalMinutes: number; percentage: number }>;
  heatmap: Array<{ date: string; count: number; level: number }>;
  topIntents: Array<{ intent: string; count: number; totalMinutes: number }>;
  peakHours: number[][];
  weeklyComparison: { thisWeek: WeekStats; lastWeek: WeekStats };
  dailyGoal: number;
}

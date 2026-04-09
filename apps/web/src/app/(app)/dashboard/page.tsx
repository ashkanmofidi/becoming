'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* ---------- Types ---------- */

interface DashboardStats {
  focusToday: number;
  allTimeCount: number;
  totalHours: number;
  goalRate: number;
  streak: number;
  streakStart: string | null;
  longestStreak: number;
}

interface FocusDay {
  date: string;
  hours: number;
  sessions: number;
}

interface CategoryItem {
  category: string;
  count: number;
  totalMinutes: number;
  percentage: number;
}

interface HeatmapCell {
  date: string;
  count: number;
  level: number; // 0-4
}

interface IntentItem {
  intent: string;
  count: number;
  totalMinutes: number;
}

interface WeekStats {
  sessions: number;
  totalMinutes: number;
  avgDuration: number;
  goalDays: number;
}

interface DashboardData {
  stats: DashboardStats;
  focusHoursByDay: FocusDay[];
  focusHours30d: FocusDay[];
  categoryBreakdown: CategoryItem[];
  heatmap: HeatmapCell[];
  topIntents: IntentItem[];
  weeklyComparison: { thisWeek: WeekStats; lastWeek: WeekStats };
  dailyGoal: number;
}

/* ---------- Constants ---------- */

const DONUT_COLORS = [
  '#D97706', // amber
  '#0D9488', // teal
  '#F59E0B', // amber-light
  '#0F766E', // teal-dark
  '#FBBF24', // amber-lighter
  '#6B7280', // surface-500
  '#FCD34D', // amber-lightest
  '#9CA3AF', // surface-300
];

const HEATMAP_LEVELS: Record<number, string> = {
  0: 'bg-surface-900',
  1: 'bg-amber-dark/40',
  2: 'bg-amber-dark/70',
  3: 'bg-amber/80',
  4: 'bg-amber',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ---------- Helpers ---------- */

function fmt(n: number, decimals = 1): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(decimals);
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function pctChange(current: number, previous: number): { label: string; positive: boolean } {
  if (previous === 0) return { label: current > 0 ? '+100%' : '0%', positive: current >= 0 };
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { label: `${sign}${Math.round(pct)}%`, positive: pct >= 0 };
}

/* ---------- Skeleton components ---------- */

function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-surface-900 rounded-xl p-4 animate-pulse">
      <div className="h-3 w-16 bg-surface-900 rounded mb-3" />
      <div className="h-7 w-12 bg-surface-900 rounded" />
    </div>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-card border border-surface-900 rounded-xl p-6 animate-pulse ${className}`}>
      <div className="h-4 w-28 bg-surface-900 rounded mb-4" />
      <div className="h-40 bg-surface-900/50 rounded" />
    </div>
  );
}

/* ---------- Empty state ---------- */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-surface-500 text-sm">
      {message}
    </div>
  );
}

/* ---------- Stat Card ---------- */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg-card border border-surface-900 rounded-xl p-4">
      <p className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-mono text-surface-100 mt-1">{value}</p>
      {sub && (
        <p className="text-[10px] font-mono text-surface-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

/* ---------- Custom Recharts Tooltip ---------- */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-surface-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] font-mono text-surface-500 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-mono text-surface-100">
          {fmt(entry.value)}h
          {entry.payload?.sessions != null && (
            <span className="text-surface-500 ml-1">
              ({entry.payload.sessions} sessions)
            </span>
          )}
        </p>
      ))}
    </div>
  );
}

/* ---------- Weekly Comparison Card ---------- */

function ComparisonRow({
  label,
  thisWeek,
  lastWeek,
  formatter,
}: {
  label: string;
  thisWeek: number;
  lastWeek: number;
  formatter: (n: number) => string;
}) {
  const { label: pct, positive } = pctChange(thisWeek, lastWeek);
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-900 last:border-0">
      <span className="text-surface-500 text-xs font-mono">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-surface-100 text-sm font-mono">{formatter(thisWeek)}</span>
        <span
          className={`text-[10px] font-mono ${positive ? 'text-teal' : 'text-amber'}`}
        >
          {pct}
        </span>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusRange, setFocusRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* --- Loading skeleton --- */
  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonBlock className="lg:col-span-2" />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    );
  }

  /* --- Error state --- */
  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
        <div className="bg-bg-card border border-surface-900 rounded-xl p-8 text-center">
          <p className="text-surface-300 mb-2">Unable to load dashboard</p>
          <p className="text-surface-500 text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="mt-4 px-4 py-2 text-sm font-mono bg-amber/10 text-amber rounded-lg hover:bg-amber/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    stats,
    focusHoursByDay,
    focusHours30d,
    categoryBreakdown,
    heatmap,
    topIntents,
    weeklyComparison,
  } = data;

  const focusChartData = (focusRange === '7d' ? focusHoursByDay : focusHours30d).map((d) => ({
    ...d,
    label: shortDate(d.date),
  }));

  const hasAnySessions = stats.allTimeCount > 0;

  /* --- Build 7x4 heatmap grid (rows = weekdays, cols = weeks) --- */
  const heatmapGrid: HeatmapCell[][] = [];
  const heatmapMap = new Map(heatmap.map((h) => [h.date, h]));

  // Build 4 weeks ending today
  const today = new Date();
  // Find the Monday of the earliest week (3 weeks ago)
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - startDay.getDay() + 1 - 21); // Monday, 3 weeks ago

  for (let row = 0; row < 7; row++) {
    const weekRow: HeatmapCell[] = [];
    for (let col = 0; col < 4; col++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + col * 7 + row);
      const iso = d.toISOString().slice(0, 10);
      const cell = heatmapMap.get(iso);
      weekRow.push(cell ?? { date: iso, count: 0, level: 0 });
    }
    heatmapGrid.push(weekRow);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* ===== PRD 7.1: Stat Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Focus Today"
          value={`${stats.focusToday}`}
          sub={`/ ${data.dailyGoal} goal`}
        />
        <StatCard label="All Time" value={`${stats.allTimeCount}`} sub="sessions" />
        <StatCard label="Total Hours" value={fmt(stats.totalHours)} />
        <StatCard
          label="Goal Rate"
          value={`${Math.round(stats.goalRate)}%`}
          sub="days on target"
        />
        <StatCard
          label="Streak"
          value={`${stats.streak}d`}
          sub={`best: ${stats.longestStreak}d`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===== PRD 7.2: Focus Hours Bar Chart ===== */}
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-amber">
              Focus Hours
            </h3>
            <div className="flex gap-1">
              {(['7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setFocusRange(range)}
                  className={`px-3 py-1 text-[10px] font-mono uppercase rounded-md transition-colors ${
                    focusRange === range
                      ? 'bg-amber/20 text-amber'
                      : 'text-surface-500 hover:text-surface-300 hover:bg-surface-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {focusChartData.length === 0 || !hasAnySessions ? (
            <EmptyState message="No focus sessions yet. Start a session to see your progress here." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={focusChartData} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280' }}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(217,119,6,0.08)' }} />
                <Bar dataKey="hours" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ===== PRD 7.3: Category Breakdown ===== */}
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">
            Category Breakdown
          </h3>

          {categoryBreakdown.length === 0 ? (
            <EmptyState message="Your focus categories will appear here." />
          ) : (
            <div className="flex gap-4">
              {/* Donut */}
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="percentage"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={44}
                      strokeWidth={0}
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)}%`, 'Share']}
                      contentStyle={{
                        background: '#111111',
                        border: '1px solid #3A3A3A',
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                      itemStyle={{ color: '#EDECE8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* List */}
              <ul className="flex-1 space-y-1.5 overflow-y-auto max-h-40">
                {categoryBreakdown.map((cat, i) => (
                  <li key={cat.category} className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="text-surface-300 truncate flex-1">{cat.category}</span>
                    <span className="text-surface-500">{Math.round(cat.percentage)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ===== PRD 7.4: Activity Heatmap ===== */}
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">
            Activity Heatmap
          </h3>

          {!hasAnySessions ? (
            <EmptyState message="Complete sessions to build your activity map." />
          ) : (
            <div className="flex gap-2">
              {/* Day labels */}
              <div className="flex flex-col gap-1 pt-0">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="h-5 flex items-center text-[9px] font-mono text-surface-500"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Grid: 4 columns (weeks), 7 rows (days) */}
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, col) => (
                  <div key={col} className="flex flex-col gap-1">
                    {heatmapGrid.map((row) => {
                      const cell = row[col] ?? { date: '', count: 0, level: 0 };
                      return (
                        <div
                          key={cell.date}
                          className={`w-5 h-5 rounded-sm ${HEATMAP_LEVELS[cell.level] ?? HEATMAP_LEVELS[0]}`}
                          title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== PRD 7.5: Top Intents ===== */}
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">
            Top Intents
          </h3>

          {topIntents.length === 0 ? (
            <EmptyState message="Your most-used focus intents will appear here." />
          ) : (
            <ul className="space-y-3">
              {topIntents.slice(0, 5).map((item, i) => {
                const maxCount = topIntents[0]?.count ?? 1;
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <li key={item.intent}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-surface-300 text-xs font-mono truncate max-w-[70%]">
                        {item.intent}
                      </span>
                      <span className="text-surface-500 text-[10px] font-mono">
                        {item.count}x &middot; {fmtDuration(item.totalMinutes)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ===== PRD 7.7: Weekly Comparison ===== */}
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">
            Weekly Comparison
          </h3>

          {weeklyComparison.thisWeek.sessions === 0 &&
          weeklyComparison.lastWeek.sessions === 0 ? (
            <EmptyState message="Complete sessions across two weeks to see your trends." />
          ) : (
            <div>
              <ComparisonRow
                label="Sessions"
                thisWeek={weeklyComparison.thisWeek.sessions}
                lastWeek={weeklyComparison.lastWeek.sessions}
                formatter={(n) => `${n}`}
              />
              <ComparisonRow
                label="Total Time"
                thisWeek={weeklyComparison.thisWeek.totalMinutes}
                lastWeek={weeklyComparison.lastWeek.totalMinutes}
                formatter={fmtDuration}
              />
              <ComparisonRow
                label="Avg Duration"
                thisWeek={weeklyComparison.thisWeek.avgDuration}
                lastWeek={weeklyComparison.lastWeek.avgDuration}
                formatter={(n) => `${Math.round(n)}m`}
              />
              <ComparisonRow
                label="Goal Days"
                thisWeek={weeklyComparison.thisWeek.goalDays}
                lastWeek={weeklyComparison.lastWeek.goalDays}
                formatter={(n) => `${n}/7`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

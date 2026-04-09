/**
 * Dashboard page. PRD Section 7.
 * Read-only analytics with server-side computation.
 * Full implementation in Phase 4.
 */
export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* Stats row placeholder (PRD 7.1) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {['Focus Today', 'All Time', 'Total Hours', 'Goal Rate', 'Streak'].map((label) => (
          <div key={label} className="bg-bg-card border border-surface-900 rounded-xl p-4">
            <p className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-mono text-surface-300 mt-1">—</p>
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-surface-900 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Focus Hours</h3>
          <div className="h-48 flex items-center justify-center text-surface-500 text-sm">
            No focus sessions yet. Start a session to see your progress here.
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Category Breakdown</h3>
          <div className="h-36 flex items-center justify-center text-surface-500 text-sm">
            Your focus categories will appear here.
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Activity Heatmap</h3>
          <div className="h-36 flex items-center justify-center text-surface-500 text-sm">
            Complete sessions to build your activity map.
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Top Intents</h3>
          <div className="h-36 flex items-center justify-center text-surface-500 text-sm">
            Your most-used focus intents will appear here.
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Peak Focus Hours</h3>
          <div className="h-36 flex items-center justify-center text-surface-500 text-sm">
            Focus during different hours to discover your peak times.
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-4">Weekly Comparison</h3>
          <div className="h-24 flex items-center justify-center text-surface-500 text-sm">
            Complete sessions across two weeks to see your trends.
          </div>
        </div>
      </div>
    </div>
  );
}

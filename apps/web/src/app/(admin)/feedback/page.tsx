'use client';

import { useState, useEffect, useMemo } from 'react';

interface FeedbackItem {
  id: string;
  userId: string;
  email: string;
  name: string;
  picture?: string;
  category: 'bug' | 'feature_request' | 'general';
  subject: string;
  description: string;
  severity?: string | null;
  status: string;
  createdAt: string;
}

type CategoryFilter = 'all' | 'bug' | 'feature_request' | 'general';
type DateRange = '7d' | '30d' | '60d' | '90d' | 'all';

/**
 * Feedback admin page. PRD Section 9.1.
 * User identity on cards, category/date filtering, selection, CSV/PDF export.
 */
export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin?view=feedback')
      .then((res) => {
        if (res.status === 401) { window.location.href = '/login?error=session_expired'; return null; }
        if (res.status === 403) { window.location.href = '/timer?error=forbidden'; return null; }
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        return res.json();
      })
      .then((data) => { if (data) setFeedback(data.feedback ?? []); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Date filter
  const dateFiltered = useMemo(() => {
    if (dateRange === 'all') return feedback;
    const days = { '7d': 7, '30d': 30, '60d': 60, '90d': 90 }[dateRange];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return feedback.filter((f) => new Date(f.createdAt) >= cutoff);
  }, [feedback, dateRange]);

  // Category filter (composes with date)
  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return dateFiltered;
    return dateFiltered.filter((f) => f.category === categoryFilter);
  }, [dateFiltered, categoryFilter]);

  // Counts within date range
  const counts = useMemo(() => ({
    all: dateFiltered.length,
    bug: dateFiltered.filter((f) => f.category === 'bug').length,
    feature_request: dateFiltered.filter((f) => f.category === 'feature_request').length,
    general: dateFiltered.filter((f) => f.category === 'general').length,
  }), [dateFiltered]);

  // Grouped view
  const grouped = useMemo(() => {
    if (!groupByCategory) return null;
    const groups: Record<string, FeedbackItem[]> = {};
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category]!.push(f);
    }
    return groups;
  }, [filtered, groupByCategory]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filtered.map((f) => f.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const selectedCount = [...selectedIds].filter((id) => filtered.some((f) => f.id === id)).length;

  // CSV export
  const exportCsv = () => {
    const items = filtered.filter((f) => selectedIds.has(f.id));
    if (items.length === 0) return;
    const bom = '\uFEFF';
    const headers = ['Name', 'Email', 'Avatar URL', 'Category', 'Subject', 'Description', 'Severity', 'Status', 'Date'];
    const rows = items.map((f) => [
      esc(f.name || 'Unknown'), esc(f.email || ''), esc(f.picture || ''),
      esc(f.category), esc(f.subject), esc(f.description),
      esc(f.severity || ''), esc(f.status), new Date(f.createdAt).toISOString(),
    ].join(','));
    const csv = bom + headers.join(',') + '\r\n' + rows.join('\r\n');
    download(csv, 'text/csv;charset=utf-8', exportFilename('csv'));
  };

  // PDF export (print-ready HTML)
  const exportPdf = () => {
    const items = filtered.filter((f) => selectedIds.has(f.id));
    if (items.length === 0) return;
    const dateLabel = dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('d', ' Days')}`;
    const catLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter === 'feature_request' ? 'Feature Request' : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feedback Report</title>
<style>
body{font-family:system-ui,sans-serif;color:#1a1a1a;max-width:800px;margin:0 auto;padding:40px 20px}
.hdr{text-align:center;margin-bottom:32px;border-bottom:2px solid #D97706;padding-bottom:16px}
.hdr h1{font-size:24px;margin:0}.hdr p{color:#666;margin:4px 0}
.card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0;page-break-inside:avoid}
.user{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.av{width:32px;height:32px;border-radius:50%;background:#D97706;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:600}
.nm{font-weight:600}.em{color:#888;font-size:12px}
.b{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;margin-right:4px}
.b-bug{background:#fef2f2;color:#dc2626}.b-feat{background:#eff6ff;color:#2563eb}.b-gen{background:#f3f4f6;color:#4b5563}
.subj{font-weight:600;margin:8px 0 4px}.desc{color:#444;font-size:14px;white-space:pre-wrap}
.dt{color:#888;font-size:12px;margin-top:8px}
.ft{text-align:center;color:#888;font-size:11px;margin-top:32px;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:0}.card{break-inside:avoid}}
</style></head><body>
<div class="hdr"><h1>Becoming.. Feedback Report</h1><p>${catLabel} — ${dateLabel}</p><p>Generated ${new Date().toLocaleDateString()} · ${items.length} entries</p></div>
${items.map((f) => `<div class="card">
<div class="user"><div class="av">${(f.name || '?').charAt(0).toUpperCase()}</div><div><div class="nm">${h(f.name || 'Unknown User')}</div><div class="em">${h(f.email || '')}</div></div></div>
<span class="b b-${f.category === 'feature_request' ? 'feat' : f.category === 'bug' ? 'bug' : 'gen'}">${f.category === 'feature_request' ? 'Feature' : f.category}</span>
${f.severity ? `<span class="b">${f.severity}</span>` : ''}
<div class="subj">${h(f.subject)}</div><div class="desc">${h(f.description)}</div>
<div class="dt">${new Date(f.createdAt).toLocaleString()}</div></div>`).join('')}
<div class="ft">Becoming.. Focus Timer — Feedback Report — Page 1</div></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const exportFilename = (ext: string) => {
    if (dateRange === 'all') return `feedback_all_time_${new Date().toISOString().slice(0, 10)}.${ext}`;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    return `feedback_${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.${ext}`;
  };

  if (isLoading) return <div className="p-6"><div className="h-48 bg-surface-900/50 rounded animate-pulse" /></div>;

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-6">Feedback</h1>
        <div className="bg-red-900/20 border border-red-800 text-red-300 text-sm p-4 rounded-lg">
          {error}<button onClick={() => window.location.reload()} className="block mt-2 text-amber hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const badge = (cat: string) => {
    const cls = cat === 'bug' ? 'bg-red-900/30 text-red-400' : cat === 'feature_request' ? 'bg-blue-900/30 text-blue-400' : 'bg-surface-700 text-surface-300';
    const label = cat === 'feature_request' ? 'Feature' : cat.charAt(0).toUpperCase() + cat.slice(1);
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${cls}`}>{label}</span>;
  };

  const renderCard = (item: FeedbackItem) => (
    <div key={item.id} className="bg-bg-card border border-surface-900 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
          className="mt-1 rounded border-surface-700 bg-surface-900 text-amber focus:ring-amber" />
        {item.picture ? (
          <img src={item.picture} alt={item.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            crossOrigin="anonymous" referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-100 font-medium truncate">{item.name || 'Unknown User'}</p>
          <p className="text-xs text-surface-500 truncate">{item.email || ''}</p>
        </div>
        <span className="text-surface-500 text-xs flex-shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {badge(item.category)}
        {item.severity && <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-orange-900/30 text-orange-400">{item.severity}</span>}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${item.status === 'new' ? 'bg-amber/20 text-amber' : 'bg-surface-700 text-surface-400'}`}>{item.status}</span>
      </div>
      <h3 className="text-surface-100 text-sm font-medium">{item.subject}</h3>
      <p className="text-surface-300 text-xs mt-1 line-clamp-3">{item.description}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Feedback</h1>
        <span className="text-surface-500 text-sm font-mono">{feedback.length} total</span>
      </div>

      {/* Category filter tabs with live counts */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {([['all', 'All'], ['general', 'General'], ['bug', 'Bug'], ['feature_request', 'Feature']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setCategoryFilter(key); setSelectedIds(new Set()); }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${categoryFilter === key ? 'bg-amber text-white' : 'text-surface-500 hover:text-surface-300'}`}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Date range + group + select + export */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={dateRange} onChange={(e) => { setDateRange(e.target.value as DateRange); setSelectedIds(new Set()); }}
          className="bg-surface-900 border border-surface-700 text-surface-100 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber">
          <option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option>
          <option value="60d">Last 60 Days</option><option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-surface-500 cursor-pointer">
          <input type="checkbox" checked={groupByCategory} onChange={(e) => setGroupByCategory(e.target.checked)}
            className="rounded border-surface-700 bg-surface-900 text-amber focus:ring-amber" />
          Group by Category
        </label>
        <div className="flex-1" />
        <button onClick={selectedCount === filtered.length && filtered.length > 0 ? deselectAll : selectAll}
          className="text-xs text-surface-400 hover:text-surface-200 transition-colors">
          {selectedCount === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
        {selectedCount > 0 && (
          <div className="relative group">
            <button
              className="px-3 py-1.5 bg-amber text-white text-xs rounded-lg hover:bg-amber-light transition-colors"
              aria-haspopup="true"
              aria-label={`Export ${selectedCount} selected items`}
            >
              Export ({selectedCount})
            </button>
            <div className="absolute right-0 top-full mt-1 bg-bg-card border border-surface-700 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[100px]" role="menu">
              <button onClick={exportCsv} role="menuitem" className="block w-full text-left px-4 py-2 text-xs text-surface-300 hover:bg-surface-900">CSV</button>
              <button onClick={exportPdf} role="menuitem" className="block w-full text-left px-4 py-2 text-xs text-surface-300 hover:bg-surface-900">PDF Report</button>
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-surface-500">
          {feedback.length === 0 ? 'No feedback yet. Users can submit feedback via the button in the app header.' : 'No feedback matches your filters.'}
        </div>
      ) : grouped ? (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-surface-400 mb-2 flex items-center gap-2">
              {badge(cat)} <span className="text-surface-500">({items.length})</span>
            </h2>
            <div className="space-y-3">{items.map(renderCard)}</div>
          </div>
        ))
      ) : (
        <div className="space-y-3">{filtered.map(renderCard)}</div>
      )}
    </div>
  );
}

function esc(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
function h(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function download(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

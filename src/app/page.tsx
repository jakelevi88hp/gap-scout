'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Zap, FileText, Calendar, LayoutGrid,
  TrendingUp, ChevronRight, X, Loader2, Star, Copy, Check,
  BarChart2, Target, Hash, Clock
} from 'lucide-react';
import type { ContentGap, GapStatus, NicheCategory, GeneratedScript } from '@/lib/types';
import { STATUS_LABELS, CATEGORY_COLORS } from '@/lib/types';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const STATUSES: GapStatus[] = ['discovered', 'scripted', 'filming', 'posted', 'winning'];
const CATEGORIES: NicheCategory[] = [
  'local-seo','google-reviews','ai-tools','marketing',
  'small-business','hvac','dental','auto-repair','law-legal','other'
];
const STORAGE_KEY = 'gap-scout-gaps';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadGaps(): ContentGap[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveGaps(gaps: ContentGap[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gaps));
}

// ──────────────────────────────────────────────
// Score Ring
// ──────────────────────────────────────────────
function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.28} fontWeight="700"
        style={{ transform: `rotate(90deg) translate(0, -${size/2 - size/2}px)`, transformOrigin: 'center' }}>
      </text>
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold text-lg ${color}`}>{score}</span>;
}

// ──────────────────────────────────────────────
// Add Gap Modal
// ──────────────────────────────────────────────
function AddGapModal({ onClose, onAdd }: { onClose: () => void; onAdd: (g: ContentGap) => void }) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<NicheCategory>('local-seo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/score-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Score failed');
      const now = new Date().toISOString();
      const gap: ContentGap = {
        id: uid(), topic: topic.trim(), category,
        searchVolume: data.searchVolume,
        tiktokResultCount: data.tiktokResultCount,
        opportunityScore: data.opportunityScore,
        nicheRelevance: data.nicheRelevance,
        status: 'discovered',
        createdAt: now, updatedAt: now,
      };
      onAdd(gap); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Add Content Gap</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Topic (from TikTok Creator Search Insights)</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)}
              placeholder='e.g. "how to get google reviews fast"'
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required autoFocus/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value as NicheCategory)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500">
              {CATEGORIES.map(c=>(
                <option key={c} value={c}>{c.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
            {loading ? <><Loader2 size={16} className="animate-spin"/> Scoring...</> : <><Zap size={16}/> Score & Add</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Script Viewer Modal
// ──────────────────────────────────────────────
function ScriptModal({ gap, onClose, onSave }: { gap: ContentGap; onClose: () => void; onSave: (g: ContentGap) => void }) {
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(gap.script || null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: gap.topic, category: gap.category,
          opportunityScore: gap.opportunityScore, searchVolume: gap.searchVolume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setScript(data.script);
      onSave({ ...gap, script: data.script, status: 'scripted', updatedAt: new Date().toISOString() });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const fullScript = script ? `🎬 HOOK:\n${script.hook}\n\n📖 BODY:\n${script.body}\n\n📣 CTA:\n${script.cta}\n\n#️⃣ HASHTAGS:\n${script.hashtags.join(' ')}` : '';

  function formatForCapCut(s: GeneratedScript): string {
    function chunk(text: string, maxWords = 7): string {
      const words = text.split(' ');
      const lines: string[] = [];
      for (let i = 0; i < words.length; i += maxWords) {
        lines.push(words.slice(i, i + maxWords).join(' '));
      }
      return lines.join('\n');
    }
    return [
      `[HOOK — say fast, first 3 sec]\n${chunk(s.hook)}`,
      `\n[BODY — deliver value]\n${chunk(s.body)}`,
      `\n[CTA — end strong]\n${chunk(s.cta)}`,
      `\n[TALKING POINTS]\n${s.talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
      `\n[TIKTOK CAPTION — paste as-is]\n${s.hashtags.join(' ')}`,
    ].join('\n');
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{gap.topic}</h2>
            <p className="text-sm text-gray-400">Opportunity: <ScoreBadge score={gap.opportunityScore}/>/100</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>

        {!script ? (
          <div className="text-center py-10">
            <FileText size={40} className="mx-auto text-gray-600 mb-3"/>
            <p className="text-gray-400 mb-4">No script yet. Generate one with AI.</p>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button onClick={generate} disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 mx-auto transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin"/> Generating...</> : <><Zap size={16}/> Generate TikTok Script</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button onClick={()=>copyText(formatForCapCut(script!), 'capcut')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors">
                {copied==='capcut' ? <Check size={12}/> : <span>📱</span>} CapCut Export
              </button>
              <button onClick={()=>copyText(fullScript, 'all')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors">
                {copied==='all' ? <Check size={12}/> : <Copy size={12}/>} Copy Full Script
              </button>
            </div>
            {[
              { label: '🎬 Hook (first 3 sec)', key: 'hook', text: script.hook, color: 'border-pink-500/40 bg-pink-500/5' },
              { label: '📖 Body (30-45 sec)', key: 'body', text: script.body, color: 'border-blue-500/40 bg-blue-500/5' },
              { label: '📣 CTA', key: 'cta', text: script.cta, color: 'border-green-500/40 bg-green-500/5' },
            ].map(({ label, key, text, color }) => (
              <div key={key} className={`border rounded-xl p-4 ${color}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  <button onClick={()=>copyText(text,key)} className="text-gray-500 hover:text-white">
                    {copied===key ? <Check size={12}/> : <Copy size={12}/>}
                  </button>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
            <div className="border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">#️⃣ Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {script.hashtags.map((h,i)=>(
                  <span key={i} className="bg-gray-800 text-purple-300 text-xs px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={generate} disabled={loading}
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mx-auto transition-colors">
              {loading ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12}/>} Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Gap Card
// ──────────────────────────────────────────────
function GapCard({ gap, onStatusChange, onOpenScript, onDelete }:
  { gap: ContentGap; onStatusChange: (id: string, s: GapStatus) => void;
    onOpenScript: (g: ContentGap) => void; onDelete: (id: string) => void }) {

  const scoreColor = gap.opportunityScore >= 70 ? 'text-green-400' :
    gap.opportunityScore >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium text-white leading-snug flex-1">{gap.topic}</p>
        <button onClick={()=>onDelete(gap.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <X size={14}/>
        </button>
      </div>

      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-3 ${CATEGORY_COLORS[gap.category]}`}>
        {gap.category.replace(/-/g,' ')}
      </span>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-900/50 rounded-lg p-2 text-center">
          <p className={`text-lg font-bold ${scoreColor}`}>{gap.opportunityScore}</p>
          <p className="text-xs text-gray-500">Opportunity</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-400">{gap.nicheRelevance}</p>
          <p className="text-xs text-gray-500">Relevance</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        TikTok results: <span className="text-gray-300">{gap.tiktokResultCount.toLocaleString()}</span>
        {' · '}Volume: <span className="text-gray-300">{gap.searchVolume}</span>
      </p>

      <div className="flex gap-2">
        <button onClick={()=>onOpenScript(gap)}
          className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600/30 text-purple-300 text-xs rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors">
          <FileText size={12}/> {gap.script ? 'View Script' : 'Generate'}
        </button>
        <select value={gap.status} onChange={e=>onStatusChange(gap.id, e.target.value as GapStatus)}
          className="bg-gray-700 border border-gray-600 text-xs text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500">
          {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Board View (Kanban)
// ──────────────────────────────────────────────
function BoardView({ gaps, onStatusChange, onOpenScript, onDelete }:
  { gaps: ContentGap[]; onStatusChange: (id: string, s: GapStatus) => void;
    onOpenScript: (g: ContentGap) => void; onDelete: (id: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map(status => {
        const cols = gaps.filter(g => g.status === status);
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-gray-300">{STATUS_LABELS[status]}</h3>
              <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{cols.length}</span>
            </div>
            <div className="space-y-3 min-h-[120px]">
              {cols.map(g => (
                <GapCard key={g.id} gap={g} onStatusChange={onStatusChange}
                  onOpenScript={onOpenScript} onDelete={onDelete}/>
              ))}
              {cols.length === 0 && (
                <div className="border-2 border-dashed border-gray-800 rounded-xl h-24 flex items-center justify-center">
                  <p className="text-gray-600 text-xs">Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Discover View (ranked list)
// ──────────────────────────────────────────────
function DiscoverView({ gaps, onStatusChange, onOpenScript, onDelete }:
  { gaps: ContentGap[]; onStatusChange: (id: string, s: GapStatus) => void;
    onOpenScript: (g: ContentGap) => void; onDelete: (id: string) => void }) {
  const sorted = [...gaps].sort((a, b) => b.opportunityScore - a.opportunityScore);
  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Target size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No gaps yet. Click <strong className="text-gray-400">+ Add Gap</strong> to scout your first opportunity.</p>
        </div>
      )}
      {sorted.map((gap, i) => (
        <div key={gap.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-all">
          <span className="text-2xl font-bold text-gray-600 w-8 text-center flex-shrink-0">#{i+1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{gap.topic}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[gap.category]}`}>
                {gap.category.replace(/-/g,' ')}
              </span>
              <span className="text-xs text-gray-500">{gap.tiktokResultCount.toLocaleString()} TikToks</span>
              <span className="text-xs text-gray-500">{STATUS_LABELS[gap.status]}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center">
              <p className={`text-xl font-bold ${gap.opportunityScore >= 70 ? 'text-green-400' : gap.opportunityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {gap.opportunityScore}
              </p>
              <p className="text-xs text-gray-500">score</p>
            </div>
            <button onClick={()=>onOpenScript(gap)}
              className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600/30 text-purple-300 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors">
              {gap.script ? 'View Script' : '✨ Generate'}
            </button>
            <button onClick={()=>onDelete(gap.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <X size={14}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Scripts View
// ──────────────────────────────────────────────
function ScriptsView({ gaps, onOpen }: { gaps: ContentGap[]; onOpen: (g: ContentGap) => void }) {
  const scripted = gaps.filter(g => g.script);
  return (
    <div className="space-y-3">
      {scripted.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No scripts yet. Generate them from the Board or Discover tab.</p>
        </div>
      )}
      {scripted.map(gap => (
        <div key={gap.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer"
          onClick={()=>onOpen(gap)}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-medium">{gap.topic}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[gap.category]}`}>
              {gap.category.replace(/-/g,' ')}
            </span>
          </div>
          {gap.script && (
            <>
              <p className="text-pink-300 text-sm mb-1">
                <span className="text-gray-500 text-xs mr-1">Hook:</span>
                {gap.script.hook.slice(0, 100)}{gap.script.hook.length > 100 ? '...' : ''}
              </p>
              <div className="flex gap-1.5 flex-wrap mt-2">
                {gap.script.hashtags.slice(0,5).map((h,i)=>(
                  <span key={i} className="text-xs text-purple-400">{h}</span>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Stats View
// ──────────────────────────────────────────────
function StatsView({ gaps }: { gaps: ContentGap[] }) {
  const total = gaps.length;
  const scripted = gaps.filter(g => g.script).length;
  const posted = gaps.filter(g => g.status === 'posted' || g.status === 'winning').length;
  const avgScore = total ? Math.round(gaps.reduce((a,g) => a + g.opportunityScore, 0) / total) : 0;
  const topGaps = [...gaps].sort((a,b) => b.opportunityScore - a.opportunityScore).slice(0,5);

  const byCat: Record<string, number> = {};
  gaps.forEach(g => { byCat[g.category] = (byCat[g.category] || 0) + 1; });
  const topCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Gaps', value: total, icon: <Target size={20}/>, color: 'text-purple-400' },
          { label: 'Scripted', value: scripted, icon: <FileText size={20}/>, color: 'text-blue-400' },
          { label: 'Posted', value: posted, icon: <TrendingUp size={20}/>, color: 'text-green-400' },
          { label: 'Avg Score', value: avgScore, icon: <BarChart2 size={20}/>, color: 'text-yellow-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
            <div className={`${color} mb-2`}>{icon}</div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🏆 Top Opportunities</h3>
          <div className="space-y-2">
            {topGaps.map((g,i) => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">#{i+1}</span>
                <p className="text-sm text-gray-200 flex-1 truncate">{g.topic}</p>
                <span className={`text-sm font-bold ${g.opportunityScore>=70?'text-green-400':g.opportunityScore>=40?'text-yellow-400':'text-red-400'}`}>
                  {g.opportunityScore}
                </span>
              </div>
            ))}
            {topGaps.length === 0 && <p className="text-gray-500 text-sm">No gaps yet</p>}
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📂 Top Categories</h3>
          <div className="space-y-2">
            {topCats.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat as NicheCategory]}`}>
                  {cat.replace(/-/g,' ')}
                </span>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{width:`${(count/total)*100}%`}}/>
                </div>
                <span className="text-gray-400 text-xs">{count}</span>
              </div>
            ))}
            {topCats.length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────
type Tab = 'board' | 'discover' | 'scripts' | 'stats';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'board',    label: 'Board',    icon: <LayoutGrid size={16}/> },
  { id: 'discover', label: 'Discover', icon: <Search size={16}/> },
  { id: 'scripts',  label: 'Scripts',  icon: <FileText size={16}/> },
  { id: 'stats',    label: 'Stats',    icon: <BarChart2 size={16}/> },
];

export default function App() {
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [tab, setTab] = useState<Tab>('discover');
  const [showAdd, setShowAdd] = useState(false);
  const [scriptGap, setScriptGap] = useState<ContentGap | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { setGaps(loadGaps()); }, []);

  const persist = useCallback((updated: ContentGap[]) => {
    setGaps(updated);
    saveGaps(updated);
  }, []);

  function addGap(g: ContentGap) {
    persist([g, ...gaps]);
  }

  function updateStatus(id: string, status: GapStatus) {
    persist(gaps.map(g => g.id === id ? { ...g, status, updatedAt: new Date().toISOString() } : g));
  }

  function saveScript(updated: ContentGap) {
    const next = gaps.map(g => g.id === updated.id ? updated : g);
    persist(next);
    setScriptGap(updated);
  }

  function deleteGap(id: string) {
    persist(gaps.filter(g => g.id !== id));
  }

  const filtered = search
    ? gaps.filter(g => g.topic.toLowerCase().includes(search.toLowerCase()) ||
        g.category.toLowerCase().includes(search.toLowerCase()))
    : gaps;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white"/>
            </div>
            <span className="font-bold text-white text-lg">Gap Scout</span>
            <span className="text-xs text-gray-500 hidden sm:block">by Apex Advantage</span>
          </div>

          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search gaps..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"/>
            </div>
          </div>

          <button onClick={()=>setShowAdd(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus size={16}/> Add Gap
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 text-sm px-4 py-2.5 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-purple-500 text-purple-400 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'board' && (
          <BoardView gaps={filtered} onStatusChange={updateStatus}
            onOpenScript={setScriptGap} onDelete={deleteGap}/>
        )}
        {tab === 'discover' && (
          <DiscoverView gaps={filtered} onStatusChange={updateStatus}
            onOpenScript={setScriptGap} onDelete={deleteGap}/>
        )}
        {tab === 'scripts' && (
          <ScriptsView gaps={filtered} onOpen={setScriptGap}/>
        )}
        {tab === 'stats' && <StatsView gaps={gaps}/>}
      </main>

      {/* Modals */}
      {showAdd && <AddGapModal onClose={()=>setShowAdd(false)} onAdd={addGap}/>}
      {scriptGap && (
        <ScriptModal gap={scriptGap} onClose={()=>setScriptGap(null)} onSave={saveScript}/>
      )}
    </div>
  );
}

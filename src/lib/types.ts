export type GapStatus = 'discovered' | 'scripted' | 'filming' | 'posted' | 'winning';

export type NicheCategory =
  | 'local-seo'
  | 'google-reviews'
  | 'ai-tools'
  | 'marketing'
  | 'small-business'
  | 'hvac'
  | 'dental'
  | 'auto-repair'
  | 'law-legal'
  | 'other';

export interface ContentGap {
  id: string;
  topic: string;
  category: NicheCategory;
  searchVolume: 'low' | 'medium' | 'high' | 'very-high';
  tiktokResultCount: number;
  opportunityScore: number; // 0-100
  nicheRelevance: number;   // 0-100
  status: GapStatus;
  script?: GeneratedScript;
  scheduledDate?: string;
  postedDate?: string;
  viewCount?: number;
  likeCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedScript {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  duration: number; // seconds
  talkingPoints: string[];
}

export const STATUS_LABELS: Record<GapStatus, string> = {
  discovered: '🔍 Discovered',
  scripted:   '✍️ Scripted',
  filming:    '🎬 Filming',
  posted:     '📤 Posted',
  winning:    '🏆 Winning',
};

export const CATEGORY_COLORS: Record<NicheCategory, string> = {
  'local-seo':      'bg-blue-500/20 text-blue-300',
  'google-reviews': 'bg-yellow-500/20 text-yellow-300',
  'ai-tools':       'bg-purple-500/20 text-purple-300',
  'marketing':      'bg-green-500/20 text-green-300',
  'small-business': 'bg-orange-500/20 text-orange-300',
  'hvac':           'bg-cyan-500/20 text-cyan-300',
  'dental':         'bg-pink-500/20 text-pink-300',
  'auto-repair':    'bg-red-500/20 text-red-300',
  'law-legal':      'bg-indigo-500/20 text-indigo-300',
  'other':          'bg-gray-500/20 text-gray-300',
};

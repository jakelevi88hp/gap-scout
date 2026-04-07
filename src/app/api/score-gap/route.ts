import { NextRequest, NextResponse } from 'next/server';

async function countTikTokResults(topic: string): Promise<number> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return Math.floor(Math.random() * 500);
  try {
    const q = `site:tiktok.com "${topic}"`;
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=1`,
      { headers: { 'X-Subscription-Token': key, Accept: 'application/json' } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.web?.totalEstimatedMatches ?? data.web?.results?.length ?? 0;
  } catch {
    return 0;
  }
}

async function getSearchDemand(topic: string): Promise<number> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return 50;
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic + ' tiktok')}&count=5`,
      { headers: { 'X-Subscription-Token': key, Accept: 'application/json' } }
    );
    if (!res.ok) return 50;
    const data = await res.json();
    return Math.min(100, (data.web?.results?.length ?? 0) * 20);
  } catch {
    return 50;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, category } = await req.json();
    if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

    const [tiktokCount, demandScore] = await Promise.all([
      countTikTokResults(topic),
      getSearchDemand(topic),
    ]);

    // Opportunity = high demand, low supply
    // supply penalty: more TikTok results = harder to break through
    const supplyPenalty = Math.min(100, Math.log10(tiktokCount + 1) * 25);
    const opportunityScore = Math.round(Math.max(0, Math.min(100, demandScore - supplyPenalty + 30)));

    // Niche relevance: bump score if topic matches known Apex niches
    const apexKeywords = ['google review', 'local seo', 'small business', 'hvac', 'dental', 'auto repair', 'law firm', 'ai tool'];
    const lower = topic.toLowerCase();
    const nicheMatch = apexKeywords.some(k => lower.includes(k));
    const nicheRelevance = nicheMatch ? Math.min(100, opportunityScore + 20) : Math.round(opportunityScore * 0.7);

    // Volume label
    let searchVolume: string;
    if (demandScore >= 80) searchVolume = 'very-high';
    else if (demandScore >= 60) searchVolume = 'high';
    else if (demandScore >= 40) searchVolume = 'medium';
    else searchVolume = 'low';

    return NextResponse.json({
      topic,
      category,
      tiktokResultCount: tiktokCount,
      opportunityScore,
      nicheRelevance,
      searchVolume,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

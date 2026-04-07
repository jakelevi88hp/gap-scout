import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { topic, category, opportunityScore, searchVolume } = await req.json();
    if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

    const prompt = `You are an expert TikTok content creator for Apex Advantage, specializing in local business marketing.
Generate a high-converting TikTok script for this CONTENT GAP opportunity:

Topic: "${topic}"
Category: ${category}
Opportunity Score: ${opportunityScore}/100
Search Volume: ${searchVolume}

The target audience is LOCAL SMALL BUSINESS OWNERS (law firms, HVAC, dental, auto repair).
Apex's offer: Google Review & Local SEO Quick-Start Pack.

Return ONLY valid JSON matching this exact schema:
{
  "hook": "The first 3 seconds — must be a bold statement or question that stops the scroll",
  "body": "The main content — 30-45 seconds of value, practical tips they can use TODAY",
  "cta": "Clear call to action — drive to DM or comment 'START'",
  "hashtags": ["array", "of", "10", "relevant", "hashtags"],
  "duration": 45,
  "talkingPoints": ["point 1", "point 2", "point 3"]
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON in response' }, { status: 500 });

    const script = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ script });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

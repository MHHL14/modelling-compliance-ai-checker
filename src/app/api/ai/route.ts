import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

// Live AI is used only for free-text generation actions and only when ANTHROPIC_API_KEY is set.
// The browser never calls the API directly; any error makes the client fall back to simulated.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

const SYSTEM: Record<string, string> = {
  generate_section:
    'You draft one paragraph of bank model documentation (reference data set documentation). Use only facts given in the prompt; do not invent numbers. Wrap every number that comes from a data source in double curly braces, e.g. {{3,412}}. Return the paragraph only.',
  extract_requirements:
    'You extract model-specific regulatory obligations and limitations from a supervisory or internal document. Return one requirement per line, each starting with "Obligation:" or "Limitation:". No other text.',
  draft_finding:
    'You draft a validation finding for a bank model validation report. Be factual, concise and neutral. Use only the information provided. Return plain text.',
  ask_row:
    'You answer a short question about one requirement assessment row in a model compliance tool. Answer in at most three sentences, only from the information provided. If the information is insufficient, say so.',
};

export async function GET() {
  return NextResponse.json({ live: !!process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_API_KEY ? MODEL : undefined });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'live AI not configured' }, { status: 503 });
  let body: { action?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const system = body.action ? SYSTEM[body.action] : undefined;
  if (!system || !body.prompt || body.prompt.length > 20000) {
    return NextResponse.json({ error: 'unsupported action' }, { status: 400 });
  }
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: body.prompt }],
    });
    if (response.stop_reason === 'refusal') return NextResponse.json({ error: 'refused' }, { status: 502 });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return NextResponse.json({ text });
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? (error.status ?? 502) : 502;
    return NextResponse.json({ error: 'live AI call failed' }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}

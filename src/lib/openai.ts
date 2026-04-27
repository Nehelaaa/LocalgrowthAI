import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const NO_KEY_MESSAGE =
  "Add OPENAI_API_KEY to your .env file and restart the server to use AI features.";

export function getOpenAI(): OpenAI | null {
  return openai ?? null;
}

export async function generateOpportunityInsights(params: {
  businessName: string;
  businessType: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  hasNoWebsite: boolean;
  hasSocialOnly?: boolean;
}): Promise<{ insights: string; revenueEstimate: string }> {
  const client = getOpenAI();
  if (!client) {
    return {
      insights: NO_KEY_MESSAGE,
      revenueEstimate: "",
    };
  }
  const prompt = `You are a web development sales analyst. For this local business, provide:
1. Why they need a professional website (2-3 short bullet points).
2. What improvements would increase their traffic and visibility.
3. A one-sentence revenue opportunity estimate (e.g. "Estimated 15-30% more leads with a professional site").

Business: ${params.businessName}
Type: ${params.businessType}
Location: ${[params.city, params.state].filter(Boolean).join(", ") || "Unknown"}
Rating: ${params.rating ?? "N/A"} (${params.reviewCount ?? 0} reviews)
Has no website: ${params.hasNoWebsite}. Social only: ${params.hasSocialOnly ?? false}.

Respond in JSON: { "insights": "markdown string", "revenueEstimate": "one sentence" }`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { insights?: string; revenueEstimate?: string };
  return {
    insights: parsed.insights ?? "",
    revenueEstimate: parsed.revenueEstimate ?? "",
  };
}

export async function generateOutreach(params: {
  businessName: string;
  businessType: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  type: "email" | "call_script" | "instagram_dm" | "loom_script";
}): Promise<string> {
  const client = getOpenAI();
  if (!client) return NO_KEY_MESSAGE;
  const loc = [params.city, params.state].filter(Boolean).join(", ") || "your area";
  const base = `${params.businessName} (${params.businessType}) in ${loc}. Rating: ${params.rating ?? "N/A"}, ${params.reviewCount ?? 0} reviews.`;

  const prompts: Record<string, string> = {
    email: `Write a short, personalized cold email (under 150 words) to win this business as a web design client. Reference: ${base}. Be friendly and specific to their niche. Include a clear CTA.`,
    call_script: `Write a 30-second call script for a cold call to this business. Reference: ${base}. Opening line, value prop, and one question to book a demo.`,
    instagram_dm: `Write a casual Instagram DM (under 100 words) to this business. Reference: ${base}. Compliment their presence and offer a free website audit.`,
    loom_script: `Write a 60-second Loom video script. Reference: ${base}. Hook in 5 sec, problem, solution (professional website), and CTA to book a call.`,
  };

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompts[params.type] }],
  });

  return completion.choices[0]?.message?.content ?? "";
}

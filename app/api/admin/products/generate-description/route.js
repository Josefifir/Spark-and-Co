import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const POST = requireAdmin(async (request) => {
  const { name, category } = await request.json().catch(() => ({}));

  if (!name || !category) {
    return NextResponse.json({ error: "name and category are required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const prompt = `Write a concise, compelling product description (2–3 sentences, max 300 characters) for a lighter shop product.
Product name: ${name}
Category: ${category}
Tone: professional, direct, no fluff. Do not start with "Introducing". Output only the description text.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("OpenAI error:", err);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
  }

  const data = await res.json();
  const description = data.choices?.[0]?.message?.content?.trim();

  if (!description) {
    return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
  }

  return NextResponse.json({ description });
});

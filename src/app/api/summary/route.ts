import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const { title, summary, type = "paper" } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        title_ja: title,
        points: [
          "API Key not configured",
          "Please check .env.local",
          "Summary unavailable",
        ],
        category: "Config Error",
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt =
      type === "video"
        ? `
      You are a robotics expert. Summarize the following YouTube video for a dashboard.
      Output must be a valid JSON object.
      
      Video Title: ${title}
      Video Description: ${summary}
      
      Required JSON Format:
      {
        "title_ja": "Japanese title (max 30 chars, catchy)",
        "points": ["Point 1 (Topic)", "Point 2 (Key content)", "Point 3 (Takeaway)"],
        "category": "Technical tag (e.g. SLAM, Manipulation, AGV, Tutorial) - English only"
      }
      
      Ensure "points" are in Japanese.
      Ensure "category" is short and precise.
    `
        : `
      You are a robotics expert. Summarize the following academic paper for a dashboard.
      Output must be a valid JSON object.
      
      Paper Title: ${title}
      Paper Summary: ${summary}
      
      Required JSON Format:
      {
        "title_ja": "Japanese title (max 30 chars, catchy)",
        "points": ["Point 1 (Issue)", "Point 2 (Method)", "Point 3 (Result)"],
        "category": "Technical tag (e.g. SLAM, Manipulation, AGV) - English only"
      }
      
      Ensure "points" are in Japanese.
      Ensure "category" is short and precise.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const text = result.response.text();
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (error) {
    console.error("Summary Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

// arXiv API Configuration
const ARXIV_BASE_URL = "http://export.arxiv.org/api/query";
const SEARCH_QUERY =
  'cat:cs.RO AND ("ROS 2" OR logistics OR warehouse OR simulation)';
const MAX_RESULTS = 5;

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  try {
    // 1. Fetch from arXiv
    const query = `search_query=${encodeURIComponent(SEARCH_QUERY)}&start=0&max_results=${MAX_RESULTS}&sortBy=submittedDate&sortOrder=descending`;
    const response = await fetch(`${ARXIV_BASE_URL}?${query}`);

    if (!response.ok) {
      throw new Error(`arXiv API failed with status: ${response.status}`);
    }

    const xmlData = await response.text();

    // 2. Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const jsonObj = parser.parse(xmlData);

    // Handle case where feed.entry is array or single object (though max_results=5 usually returns array)
    const entries = jsonObj.feed?.entry;
    if (!entries) {
      return NextResponse.json({ papers: [] });
    }
    const papers = Array.isArray(entries) ? entries : [entries];

    // 3. Summarize with Gemini
    if (!GEMINI_API_KEY) {
      console.warn(
        "GEMINI_API_KEY is not set. Returning raw data without summary.",
      );
      // Fallback if no key: return raw titles
      const fallbackData = papers.map((p: any) => ({
        title_ja: p.title.replace(/\n/g, " "),
        points: [
          "Gemini API Key missing",
          "Please configure .env.local",
          "Summary unavailable",
        ],
        category: "Raw Data",
        link: p.id,
        original_title: p.title,
      }));
      return NextResponse.json({ papers: fallbackData });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const summarizedPapers = await Promise.all(
      papers.map(async (paper: any) => {
        try {
          const title = paper.title.replace(/\n/g, " ");
          const summary = paper.summary.replace(/\n/g, " ");
          const id = paper.id;

          const prompt = `
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

          return {
            ...json,
            link: id,
            original_title: title,
          };
        } catch (error) {
          console.error("Gemini summarization failed for a paper:", error);
          return {
            title_ja: paper.title.replace(/\n/g, " "), // Fallback to English title
            points: [
              "要約生成に失敗しました",
              "APIエラーまたは解析エラー",
              "原文を確認してください",
            ],
            category: "Error",
            link: paper.id,
            original_title: paper.title,
          };
        }
      }),
    );

    return NextResponse.json({ papers: summarizedPapers });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}

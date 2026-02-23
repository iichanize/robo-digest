import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

// arXiv API Configuration
const ARXIV_BASE_URL = "http://export.arxiv.org/api/query";
const DEFAULT_SEARCH_QUERY =
  'cat:cs.RO AND ("ROS 2" OR logistics OR warehouse OR simulation)';
const MAX_RESULTS = 10; // Increased since we are not summarizing everything

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q");

    // Sort parameter
    const VALID_SORT_BY = ["submittedDate", "relevance", "lastUpdatedDate"];
    const sortByParam = searchParams.get("sortBy") || "submittedDate";
    const sortBy = VALID_SORT_BY.includes(sortByParam)
      ? sortByParam
      : "submittedDate";

    // Construct query
    // If keyword is provided, search in all fields for that keyword within cs.RO category
    // Otherwise use the default complex query
    let apiQuery = DEFAULT_SEARCH_QUERY;
    if (keyword) {
      apiQuery = `cat:cs.RO AND all:"${keyword}"`;
    }

    // 1. Fetch from arXiv
    const query = `search_query=${encodeURIComponent(apiQuery)}&start=0&max_results=${MAX_RESULTS}&sortBy=${sortBy}&sortOrder=descending`;
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

    const entries = jsonObj.feed?.entry;
    if (!entries) {
      return NextResponse.json({ papers: [] });
    }
    const papers = Array.isArray(entries) ? entries : [entries];

    // 3. Return raw data (Client will request summary)
    const formattedPapers = papers.map((p: any) => ({
      id: p.id,
      title: p.title.replace(/\n/g, " "),
      summary: p.summary.replace(/\n/g, " "),
      published: p.published,
      link: p.id,
    }));

    return NextResponse.json({ papers: formattedPapers });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}

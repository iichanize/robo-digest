import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";
const DEFAULT_QUERY = "robotics ROS2";

export async function GET(request: Request) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: "YouTube API Key not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || DEFAULT_QUERY;
    const maxResults = Math.min(
      Number(searchParams.get("maxResults")) || 10,
      50,
    );
    const pageToken = searchParams.get("pageToken") || "";

    // Sort parameter
    const VALID_ORDERS = ["date", "relevance", "viewCount", "rating"];
    const orderParam = searchParams.get("order") || "date";
    const order = VALID_ORDERS.includes(orderParam) ? orderParam : "date";

    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      order,
      maxResults: String(maxResults),
      regionCode: "JP",
      key: YOUTUBE_API_KEY,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData);
      throw new Error(`YouTube API failed with status: ${response.status}`);
    }

    const data = await response.json();

    const videos = (data.items || []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: {
            medium?: { url: string };
            default?: { url: string };
          };
          channelTitle: string;
          publishedAt: string;
        };
      }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url ||
          "",
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }),
    );

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null,
      totalResults: data.pageInfo?.totalResults || 0,
    });
  } catch (error) {
    console.error("YouTube API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube videos" },
      { status: 500 },
    );
  }
}

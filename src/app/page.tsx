"use client";

import { useEffect, useState, useCallback } from "react";
import { type Paper, type Video, type ContentItem } from "./types";
import Header from "./components/Header";
import PaperCard from "./components/PaperCard";
import VideoCard from "./components/VideoCard";
import SkeletonCard from "./components/SkeletonCard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"papers" | "youtube">("papers");

  // Papers state
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);

  // YouTube state
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [videosInitialized, setVideosInitialized] = useState(false);

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Bookmarks: unified Paper + Video
  const [bookmarks, setBookmarks] = useState<ContentItem[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [summarizing, setSummarizing] = useState<Set<string>>(new Set());

  // Load bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem("robo-digest-bookmarks-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          "id" in parsed[0]
        ) {
          const uniqueBookmarks = Array.from(
            new Map(
              parsed.map((item: ContentItem) => [item.id, item]),
            ).values(),
          );
          setBookmarks(uniqueBookmarks as ContentItem[]);
        }
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  // Also migrate old bookmarks (papers only) if they exist
  useEffect(() => {
    const oldSaved = localStorage.getItem("robo-digest-bookmarks");
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          "id" in parsed[0]
        ) {
          const migrated: ContentItem[] = parsed.map((p: Paper) => ({
            ...p,
            type: "paper" as const,
          }));
          setBookmarks((prev) => {
            const merged = [...prev, ...migrated];
            return Array.from(
              new Map(merged.map((item) => [item.id, item])).values(),
            ) as ContentItem[];
          });
          localStorage.removeItem("robo-digest-bookmarks");
        }
      } catch (e) {
        console.error("Failed to migrate old bookmarks", e);
      }
    }
  }, []);

  // Save bookmarks on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "robo-digest-bookmarks-v2",
        JSON.stringify(bookmarks),
      );
    }
  }, [bookmarks]);

  // Fetch papers
  useEffect(() => {
    const fetchPapers = async () => {
      setPapersLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setPapers(data.papers);
      } catch (err) {
        if (activeTab === "papers") {
          setError("論文の取得に失敗しました。");
        }
        console.error(err);
      } finally {
        setPapersLoading(false);
      }
    };

    if (activeTab === "papers" || !videosInitialized) {
      fetchPapers();
    }
  }, [searchQuery, activeTab, videosInitialized]);

  // Fetch YouTube videos
  const fetchVideos = useCallback(
    async (append = false, pageToken?: string) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setVideosLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (pageToken) {
          params.set("pageToken", pageToken);
        }
        const res = await fetch(`/api/youtube?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch videos");
        const data = await res.json();

        if (append) {
          setVideos((prev) => [...prev, ...data.videos]);
        } else {
          setVideos(data.videos);
        }
        setNextPageToken(data.nextPageToken);
        setVideosInitialized(true);
      } catch (err) {
        if (activeTab === "youtube") {
          setError("YouTube動画の取得に失敗しました。");
        }
        console.error(err);
      } finally {
        setVideosLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, activeTab],
  );

  // Trigger YouTube fetch when tab switches to youtube or search changes
  useEffect(() => {
    if (activeTab === "youtube") {
      fetchVideos(false);
    }
  }, [activeTab, searchQuery, fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(keyword);
    setShowSavedOnly(false);
  };

  const handleTabChange = (tab: "papers" | "youtube") => {
    setActiveTab(tab);
    setShowSavedOnly(false);
    setError(null);
  };

  const isBookmarked = (id: string) => bookmarks.some((b) => b.id === id);

  const togglePaperBookmark = (paper: Paper, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === paper.id)) {
        return prev.filter((b) => b.id !== paper.id);
      } else {
        return [...prev, { ...paper, type: "paper" as const }];
      }
    });
  };

  const toggleVideoBookmark = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === video.id)) {
        return prev.filter((b) => b.id !== video.id);
      } else {
        return [...prev, { ...video, type: "video" as const }];
      }
    });
  };

  const handleSummarizePaper = async (paper: Paper) => {
    if (summarizing.has(paper.id)) return;
    setSummarizing((prev) => new Set(prev).add(paper.id));

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paper.title,
          summary: paper.summary,
          type: "paper",
        }),
      });

      if (!res.ok) throw new Error("Summary failed");
      const data = await res.json();
      const updatedPaper = { ...paper, ...data };

      setPapers((prev) =>
        prev.map((p) => (p.id === paper.id ? updatedPaper : p)),
      );
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === paper.id ? { ...updatedPaper, type: "paper" as const } : b,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("要約の生成に失敗しました");
    } finally {
      setSummarizing((prev) => {
        const next = new Set(prev);
        next.delete(paper.id);
        return next;
      });
    }
  };

  const handleSummarizeVideo = async (video: Video) => {
    if (summarizing.has(video.id)) return;
    setSummarizing((prev) => new Set(prev).add(video.id));

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          summary: video.description,
          type: "video",
        }),
      });

      if (!res.ok) throw new Error("Summary failed");
      const data = await res.json();
      const updatedVideo = { ...video, ...data };

      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? updatedVideo : v)),
      );
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === video.id ? { ...updatedVideo, type: "video" as const } : b,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("要約の生成に失敗しました");
    } finally {
      setSummarizing((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  // Determine loading state
  const isLoading = activeTab === "papers" ? papersLoading : videosLoading;
  const skeletonVariant = activeTab === "papers" ? "paper" : "video";

  // Render content
  const renderContent = () => {
    // Favorites mode: show all bookmarks (mixed)
    if (showSavedOnly) {
      if (bookmarks.length === 0) {
        return (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              お気に入りのコンテンツはまだありません。
            </p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((item) =>
            item.type === "paper" ? (
              <PaperCard
                key={item.id}
                paper={item}
                isBookmarked={true}
                isSummarizing={summarizing.has(item.id)}
                onToggleBookmark={togglePaperBookmark}
                onSummarize={handleSummarizePaper}
              />
            ) : (
              <VideoCard
                key={item.id}
                video={item}
                isBookmarked={true}
                isSummarizing={summarizing.has(item.id)}
                onToggleBookmark={toggleVideoBookmark}
                onSummarize={handleSummarizeVideo}
              />
            ),
          )}
        </div>
      );
    }

    // Loading
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} variant={skeletonVariant} />
          ))}
        </div>
      );
    }

    // Error
    if (error) {
      return (
        <div className="text-center py-10">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            再読み込み
          </button>
        </div>
      );
    }

    // Papers tab
    if (activeTab === "papers") {
      if (papers.length === 0) {
        return (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              論文が見つかりませんでした。
            </p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isBookmarked={isBookmarked(paper.id)}
              isSummarizing={summarizing.has(paper.id)}
              onToggleBookmark={togglePaperBookmark}
              onSummarize={handleSummarizePaper}
            />
          ))}
        </div>
      );
    }

    // YouTube tab
    if (videos.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">動画が見つかりませんでした。</p>
        </div>
      );
    }
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isBookmarked={isBookmarked(video.id)}
              isSummarizing={summarizing.has(video.id)}
              onToggleBookmark={toggleVideoBookmark}
              onSummarize={handleSummarizeVideo}
            />
          ))}
        </div>
        {nextPageToken && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchVideos(true, nextPageToken)}
              disabled={loadingMore}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  読み込み中...
                </span>
              ) : (
                "もっと読み込む"
              )}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showSavedOnly={showSavedOnly}
          onToggleSaved={() => setShowSavedOnly(!showSavedOnly)}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          bookmarkCount={bookmarks.length}
        />
        {renderContent()}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { type Paper, type Video, type ContentItem } from "./types";
import Header, {
  type PaperSortOption,
  type YouTubeSortOption,
} from "./components/Header";
import PaperCard from "./components/PaperCard";
import VideoCard from "./components/VideoCard";
import SkeletonCard from "./components/SkeletonCard";
import FavoritesView from "./components/FavoritesView";
import { useFavorites } from "./hooks/useFavorites";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "papers" | "youtube" | "favorites"
  >("papers");

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

  // Sort state
  const [paperSort, setPaperSort] = useState<PaperSortOption>("submittedDate");
  const [youtubeSort, setYoutubeSort] = useState<YouTubeSortOption>("date");

  // Favorites hook
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    getFilteredFavorites,
    exportAsMarkdown,
    updateFavoriteContent,
  } = useFavorites();

  const [summarizing, setSummarizing] = useState<Set<string>>(new Set());

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
        params.set("sortBy", paperSort);
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
  }, [searchQuery, activeTab, videosInitialized, paperSort]);

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
        params.set("order", youtubeSort);
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
    [searchQuery, activeTab, youtubeSort],
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
  };

  const handleTabChange = (tab: "papers" | "youtube" | "favorites") => {
    setActiveTab(tab);
    setError(null);
    // Reset sort to default when switching tabs
    if (tab === "papers") {
      setPaperSort("submittedDate");
    } else if (tab === "youtube") {
      setYoutubeSort("date");
    }
  };

  const togglePaperBookmark = (paper: Paper, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({ ...paper, type: "paper" as const });
  };

  const toggleVideoBookmark = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({ ...video, type: "video" as const });
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
      // Also update in favorites if bookmarked
      if (isFavorite(paper.id)) {
        updateFavoriteContent({ ...updatedPaper, type: "paper" as const });
      }
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
      // Also update in favorites if bookmarked
      if (isFavorite(video.id)) {
        updateFavoriteContent({ ...updatedVideo, type: "video" as const });
      }
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
    // Favorites tab
    if (activeTab === "favorites") {
      return (
        <FavoritesView
          getFilteredFavorites={getFilteredFavorites}
          exportAsMarkdown={exportAsMarkdown}
          isFavorite={isFavorite}
          onTogglePaperBookmark={togglePaperBookmark}
          onToggleVideoBookmark={toggleVideoBookmark}
          onSummarizePaper={handleSummarizePaper}
          onSummarizeVideo={handleSummarizeVideo}
          summarizing={summarizing}
        />
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
            <p className="text-slate-500 dark:text-slate-400 text-lg">
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
              isBookmarked={isFavorite(paper.id)}
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
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            動画が見つかりませんでした。
          </p>
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
              isBookmarked={isFavorite(video.id)}
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          favoriteCount={favorites.length}
          paperSort={paperSort}
          youtubeSort={youtubeSort}
          onPaperSortChange={setPaperSort}
          onYoutubeSortChange={setYoutubeSort}
        />
        {renderContent()}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

type Paper = {
  id: string;
  title: string;
  summary: string;
  published: string;
  link: string;
  title_ja?: string;
  points?: string[];
  category?: string;
};

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Bookmarks State: Store full Paper objects
  const [bookmarks, setBookmarks] = useState<Paper[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [summarizing, setSummarizing] = useState<Set<string>>(new Set());

  // Load bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem("robo-digest-bookmarks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          "id" in parsed[0]
        ) {
          // Deduplicate by ID
          const uniqueBookmarks = Array.from(
            new Map(parsed.map((item: Paper) => [item.id, item])).values(),
          );
          setBookmarks(uniqueBookmarks as Paper[]);
        } else {
          // Invalid or old format (e.g. array of strings), clear it
          localStorage.removeItem("robo-digest-bookmarks");
        }
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  // Save bookmarks on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("robo-digest-bookmarks", JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  useEffect(() => {
    const fetchPapers = async () => {
      // If showing saved only, we don't necessarily need to fetch,
      // but usually we want to keep the background list updated or just let it stay.
      // If the user searches while in "Saved Only" mode, should we switch back?
      // For now, let's keep fetching independent of view mode.
      setLoading(true);
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
        setError("論文の取得に失敗しました。");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(keyword);
    // Optionally switch back to all papers view on search
    setShowSavedOnly(false);
  };

  const isBookmarked = (id: string) => bookmarks.some((b) => b.id === id);

  const toggleBookmark = (paper: Paper, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === paper.id)) {
        return prev.filter((b) => b.id !== paper.id);
      } else {
        return [...prev, paper];
      }
    });
  };

  const handleSummarize = async (paper: Paper) => {
    if (summarizing.has(paper.id)) return;

    setSummarizing((prev) => new Set(prev).add(paper.id));

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paper.title,
          summary: paper.summary,
        }),
      });

      if (!res.ok) throw new Error("Summary failed");

      const data = await res.json();

      // Update both the main list AND the bookmarks if this paper is bookmarked
      const updatedPaper = { ...paper, ...data };

      setPapers((prev) =>
        prev.map((p) => (p.id === paper.id ? updatedPaper : p)),
      );

      setBookmarks((prev) =>
        prev.map((b) => (b.id === paper.id ? updatedPaper : b)),
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

  // Decide what to display
  const displayedPapers = showSavedOnly ? bookmarks : papers;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight">
              RoboDigest
            </h1>
            <p className="mt-2 text-slate-600">
              Robotics Research Dashboard{" "}
              {searchQuery && !showSavedOnly && `for "${searchQuery}"`}
              {showSavedOnly && " (Favorites)"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                showSavedOnly
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200 border"
                  : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {showSavedOnly ? "全て表示" : "お気に入り"}
            </button>

            <form
              onSubmit={handleSearch}
              className="flex gap-2 w-full sm:w-auto"
              suppressHydrationWarning={true}
            >
              <input
                type="text"
                placeholder="Search keywords..."
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                suppressHydrationWarning={true}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </form>
          </div>
        </header>

        {loading && !showSavedOnly ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse h-80"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error && !showSavedOnly ? (
          <div className="text-center py-10">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              再読み込み
            </button>
          </div>
        ) : displayedPapers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              {showSavedOnly
                ? "お気に入りの論文はまだありません。"
                : "論文が見つかりませんでした。"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPapers.map((paper) => (
              <article
                key={paper.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col relative group"
              >
                <button
                  onClick={(e) => toggleBookmark(paper, e)}
                  className="absolute top-4 right-4 z-10 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition"
                  title={
                    isBookmarked(paper.id) ? "お気に入り解除" : "お気に入り追加"
                  }
                >
                  {isBookmarked(paper.id) ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  )}
                </button>

                <div className="p-6 flex-1">
                  {paper.category && (
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                        {paper.category}
                      </span>
                    </div>
                  )}

                  {paper.title_ja ? (
                    <>
                      <h2 className="text-xl font-bold text-slate-800 leading-snug mb-2 pr-8">
                        {paper.title_ja}
                      </h2>
                      <ul className="space-y-2 text-sm text-slate-600 mt-4 mb-4">
                        {paper.points?.map((point, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-slate-800 leading-snug mb-2 pr-8">
                        {paper.title}
                      </h2>
                      <p className="text-sm text-slate-500 line-clamp-4 mb-4">
                        {paper.summary}
                      </p>
                    </>
                  )}
                </div>

                <div className="p-6 pt-0 mt-auto flex flex-col gap-3">
                  {!paper.title_ja && (
                    <button
                      onClick={() => handleSummarize(paper)}
                      disabled={summarizing.has(paper.id)}
                      className="w-full py-2 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm flex justify-center items-center"
                    >
                      {summarizing.has(paper.id) ? (
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700 mr-2"></span>
                      ) : (
                        "✨ AI要約する"
                      )}
                    </button>
                  )}
                  <a
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm"
                  >
                    原文を読む
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

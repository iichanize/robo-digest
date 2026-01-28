"use client";

import { useEffect, useState } from "react";

type Paper = {
  id: string;
  title: string;
  summary: string;
  published: string;
  link: string;
  // Summary fields are optional initially
  title_ja?: string;
  points?: string[];
  category?: string;
};

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Default empty means default complex query

  // State to track which papers are currently being summarized
  const [summarizing, setSummarizing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPapers = async () => {
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

      // Update the specific paper with summary data
      setPapers((prev) =>
        prev.map((p) => (p.id === paper.id ? { ...p, ...data } : p)),
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
              {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search keywords..."
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </form>
        </header>

        {loading ? (
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
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              再読み込み
            </button>
          </div>
        ) : papers.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No papers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <article
                key={paper.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col"
              >
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
                      <h2 className="text-xl font-bold text-slate-800 leading-snug mb-2">
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
                      <h2 className="text-lg font-semibold text-slate-800 leading-snug mb-2">
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

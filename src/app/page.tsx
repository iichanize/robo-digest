"use client";

import { useEffect, useState } from "react";

type Paper = {
  title_ja: string;
  points: string[];
  category: string;
  link: string;
  original_title: string;
};

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await fetch("/api/news");
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
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight">
            RoboDigest
          </h1>
          <p className="mt-2 text-slate-600">
            今日のロボティクス（ROS 2 / 物流 / シミュレーション）最新トレンド
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
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
                <div className="h-10 bg-slate-200 rounded w-full"></div>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper, idx) => (
              <article
                key={idx}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                      {paper.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 leading-snug mb-2">
                    {paper.title_ja}
                  </h2>
                  <p
                    className="text-xs text-slate-400 font-mono mb-4 truncate"
                    title={paper.original_title}
                  >
                    {paper.original_title}
                  </p>

                  <ul className="space-y-2 text-sm text-slate-600">
                    {paper.points.map((point, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2.5 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm"
                  >
                    論文を読む
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

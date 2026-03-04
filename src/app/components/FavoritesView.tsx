"use client";

import { useState } from "react";
import { type Paper, type Video, type FavoriteItem } from "../types";
import { type FilterPeriod } from "../hooks/useFavorites";
import PaperCard from "./PaperCard";
import VideoCard from "./VideoCard";

type FavoritesViewProps = {
  getFilteredFavorites: (period: FilterPeriod) => FavoriteItem[];
  exportAsMarkdown: (items: FavoriteItem[]) => string;
  isFavorite: (id: string) => boolean;
  onTogglePaperBookmark: (paper: Paper, e: React.MouseEvent) => void;
  onToggleVideoBookmark: (video: Video, e: React.MouseEvent) => void;
  onSummarizePaper: (paper: Paper) => void;
  onSummarizeVideo: (video: Video) => void;
  summarizing: Set<string>;
};

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "7days", label: "過去7日間" },
  { value: "30days", label: "過去30日間" },
];

export default function FavoritesView({
  getFilteredFavorites,
  exportAsMarkdown,
  isFavorite,
  onTogglePaperBookmark,
  onToggleVideoBookmark,
  onSummarizePaper,
  onSummarizeVideo,
  summarizing,
}: FavoritesViewProps) {
  const [period, setPeriod] = useState<FilterPeriod>("all");
  const [copied, setCopied] = useState(false);

  const filtered = getFilteredFavorites(period);

  const handleCopy = async () => {
    const markdown = exportAsMarkdown(filtered);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
      alert("クリップボードへのコピーに失敗しました");
    }
  };

  return (
    <div>
      {/* Filter bar + Export button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Period filter buttons */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                period === opt.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Export button */}
        <button
          onClick={handleCopy}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {copied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              コピーしました！
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Markdownでコピー
            </>
          )}
        </button>
      </div>

      {/* Item count */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {filtered.length}件のお気に入り
      </p>

      {/* Favorites list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {period === "all"
              ? "お気に入りのコンテンツはまだありません。"
              : "この期間のお気に入りはありません。"}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            論文やYouTubeの★アイコンをクリックして追加できます。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((fav) =>
            fav.content.type === "paper" ? (
              <PaperCard
                key={fav.content.id}
                paper={fav.content}
                isBookmarked={isFavorite(fav.content.id)}
                isSummarizing={summarizing.has(fav.content.id)}
                onToggleBookmark={onTogglePaperBookmark}
                onSummarize={onSummarizePaper}
                addedAt={fav.addedAt}
              />
            ) : (
              <VideoCard
                key={fav.content.id}
                video={fav.content}
                isBookmarked={isFavorite(fav.content.id)}
                isSummarizing={summarizing.has(fav.content.id)}
                onToggleBookmark={onToggleVideoBookmark}
                onSummarize={onSummarizeVideo}
                addedAt={fav.addedAt}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

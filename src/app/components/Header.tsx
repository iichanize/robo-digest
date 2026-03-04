"use client";

import ThemeToggle from "./ThemeToggle";

export type PaperSortOption = "submittedDate" | "relevance" | "lastUpdatedDate";
export type YouTubeSortOption = "date" | "relevance" | "viewCount" | "rating";

type HeaderProps = {
  activeTab: "papers" | "youtube" | "favorites";
  onTabChange: (tab: "papers" | "youtube" | "favorites") => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  searchQuery: string;
  favoriteCount: number;
  paperSort: PaperSortOption;
  youtubeSort: YouTubeSortOption;
  onPaperSortChange: (sort: PaperSortOption) => void;
  onYoutubeSortChange: (sort: YouTubeSortOption) => void;
};

export default function Header({
  activeTab,
  onTabChange,
  keyword,
  onKeywordChange,
  onSearch,
  searchQuery,
  favoriteCount,
  paperSort,
  youtubeSort,
  onPaperSortChange,
  onYoutubeSortChange,
}: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 tracking-tight">
            RoboDigest
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Robotics Research Dashboard{" "}
            {searchQuery && activeTab !== "favorites" && `for "${searchQuery}"`}
            {activeTab === "favorites" && " — お気に入り"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          <ThemeToggle />

          {activeTab !== "favorites" && (
            <form
              onSubmit={onSearch}
              className="flex gap-2 w-full sm:w-auto"
              suppressHydrationWarning={true}
            >
              <input
                type="text"
                placeholder={
                  activeTab === "papers"
                    ? "Search papers..."
                    : "Search YouTube..."
                }
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                suppressHydrationWarning={true}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex">
          <button
            onClick={() => onTabChange("papers")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "papers"
                ? "text-indigo-700 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            📄 論文
            {activeTab === "papers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-700 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => onTabChange("youtube")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "youtube"
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ▶ YouTube
            {activeTab === "youtube" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => onTabChange("favorites")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "favorites"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ⭐ お気に入り
            {favoriteCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400">
                {favoriteCount}
              </span>
            )}
            {activeTab === "favorites" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 dark:bg-yellow-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Sort dropdown - only show for papers/youtube tabs */}
        {activeTab !== "favorites" && (
          <div className="flex items-center gap-2 pb-1">
            <label className="text-xs text-slate-400 dark:text-slate-500">
              並び替え
            </label>
            {activeTab === "papers" ? (
              <select
                value={paperSort}
                onChange={(e) =>
                  onPaperSortChange(e.target.value as PaperSortOption)
                }
                className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="submittedDate">📅 新着順</option>
                <option value="relevance">🔍 関連度順</option>
                <option value="lastUpdatedDate">🔄 更新日順</option>
              </select>
            ) : (
              <select
                value={youtubeSort}
                onChange={(e) =>
                  onYoutubeSortChange(e.target.value as YouTubeSortOption)
                }
                className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="date">📅 新着順</option>
                <option value="relevance">🔍 関連度順</option>
                <option value="viewCount">👁 再生回数順</option>
                <option value="rating">⭐ 評価順</option>
              </select>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

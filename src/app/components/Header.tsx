"use client";

type HeaderProps = {
  activeTab: "papers" | "youtube";
  onTabChange: (tab: "papers" | "youtube") => void;
  showSavedOnly: boolean;
  onToggleSaved: () => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  searchQuery: string;
  bookmarkCount: number;
};

export default function Header({
  activeTab,
  onTabChange,
  showSavedOnly,
  onToggleSaved,
  keyword,
  onKeywordChange,
  onSearch,
  searchQuery,
  bookmarkCount,
}: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
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
            onClick={onToggleSaved}
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
            {showSavedOnly
              ? "全て表示"
              : `お気に入り${bookmarkCount > 0 ? ` (${bookmarkCount})` : ""}`}
          </button>

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
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
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
        </div>
      </div>

      {/* Tabs */}
      {!showSavedOnly && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => onTabChange("papers")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "papers"
                ? "text-indigo-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📄 論文
            {activeTab === "papers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-700 rounded-full" />
            )}
          </button>
          <button
            onClick={() => onTabChange("youtube")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "youtube"
                ? "text-red-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ▶ YouTube
            {activeTab === "youtube" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        </div>
      )}
    </header>
  );
}

"use client";

import { type Paper } from "../types";

type PaperCardProps = {
  paper: Paper;
  isBookmarked: boolean;
  isSummarizing: boolean;
  onToggleBookmark: (paper: Paper, e: React.MouseEvent) => void;
  onSummarize: (paper: Paper) => void;
};

export default function PaperCard({
  paper,
  isBookmarked,
  isSummarizing,
  onToggleBookmark,
  onSummarize,
}: PaperCardProps) {
  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col relative group">
      <button
        onClick={(e) => onToggleBookmark(paper, e)}
        className="absolute top-4 right-4 z-10 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition"
        title={isBookmarked ? "お気に入り解除" : "お気に入り追加"}
      >
        {isBookmarked ? (
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
            onClick={() => onSummarize(paper)}
            disabled={isSummarizing}
            className="w-full py-2 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm flex justify-center items-center"
          >
            {isSummarizing ? (
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
  );
}

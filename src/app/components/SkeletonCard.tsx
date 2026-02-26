"use client";

type SkeletonCardProps = {
  variant?: "paper" | "video";
};

export default function SkeletonCard({ variant = "paper" }: SkeletonCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
      {variant === "video" && (
        <div className="h-48 bg-slate-200 dark:bg-slate-700" />
      )}
      <div className="p-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

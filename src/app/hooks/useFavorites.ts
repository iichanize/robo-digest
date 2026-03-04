"use client";

import { useState, useEffect, useCallback } from "react";
import { type ContentItem, type FavoriteItem } from "../types";

const STORAGE_KEY = "robo_digest_favorites";
const OLD_STORAGE_KEY = "robo-digest-bookmarks-v2";
const LEGACY_STORAGE_KEY = "robo-digest-bookmarks";

export type FilterPeriod = "all" | "7days" | "30days";

function loadFromStorage(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load favorites", e);
  }
  return [];
}

function saveToStorage(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * 旧ブックマークデータ（ContentItem[]）を FavoriteItem[] に変換する
 */
function migrateOldBookmarks(): FavoriteItem[] {
  if (typeof window === "undefined") return [];

  const migrated: FavoriteItem[] = [];

  // v2 bookmarks (ContentItem[])
  try {
    const v2Raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "object" && "id" in item && "type" in item) {
            migrated.push({
              content: item as ContentItem,
              addedAt: new Date().toISOString(),
            });
          }
        }
      }
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to migrate v2 bookmarks", e);
  }

  // Legacy bookmarks (Paper[] without type field)
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "object" && "id" in item) {
            migrated.push({
              content: { ...item, type: "paper" as const } as ContentItem,
              addedAt: new Date().toISOString(),
            });
          }
        }
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to migrate legacy bookmarks", e);
  }

  return migrated;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load on mount + migrate old data
  useEffect(() => {
    let items = loadFromStorage();

    // Migrate if new storage is empty
    if (items.length === 0) {
      const migrated = migrateOldBookmarks();
      if (migrated.length > 0) {
        // Deduplicate by content.id
        const unique = Array.from(
          new Map(migrated.map((f) => [f.content.id, f])).values(),
        );
        items = unique;
        saveToStorage(items);
      }
    }

    setFavorites(items);
    setInitialized(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (initialized) {
      saveToStorage(favorites);
    }
  }, [favorites, initialized]);

  const addFavorite = useCallback((content: ContentItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.content.id === content.id)) return prev;
      return [...prev, { content, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.content.id !== id));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.content.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (content: ContentItem) => {
      if (isFavorite(content.id)) {
        removeFavorite(content.id);
      } else {
        addFavorite(content);
      }
    },
    [isFavorite, removeFavorite, addFavorite],
  );

  const getFilteredFavorites = useCallback(
    (period: FilterPeriod): FavoriteItem[] => {
      const now = new Date();
      let filtered = [...favorites];

      if (period === "7days") {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((f) => new Date(f.addedAt) >= cutoff);
      } else if (period === "30days") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((f) => new Date(f.addedAt) >= cutoff);
      }

      // Sort by addedAt descending (newest first)
      filtered.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );

      return filtered;
    },
    [favorites],
  );

  const exportAsMarkdown = useCallback((items: FavoriteItem[]): string => {
    return items
      .map(
        (item) => `## ${item.content.title_ja || item.content.title}
- 取得元: ${item.content.type === "paper" ? "論文 (arXiv)" : "YouTube"}
- URL: ${item.content.type === "paper" ? item.content.link : item.content.link}
- 追加日: ${new Date(item.addedAt).toLocaleDateString("ja-JP")}
- AI要約:
${item.content.type === "paper" ? item.content.summary : item.content.description}
---`,
      )
      .join("\n\n");
  }, []);

  // Update content in favorites (for AI summary updates)
  const updateFavoriteContent = useCallback((content: ContentItem) => {
    setFavorites((prev) =>
      prev.map((f) => (f.content.id === content.id ? { ...f, content } : f)),
    );
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFilteredFavorites,
    exportAsMarkdown,
    updateFavoriteContent,
  };
}

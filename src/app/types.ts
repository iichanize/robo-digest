export type Paper = {
  id: string;
  title: string;
  summary: string;
  published: string;
  link: string;
  title_ja?: string;
  points?: string[];
  category?: string;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  link: string;
  title_ja?: string;
  points?: string[];
  category?: string;
};

export type ContentItem =
  | (Paper & { type: "paper" })
  | (Video & { type: "video" });

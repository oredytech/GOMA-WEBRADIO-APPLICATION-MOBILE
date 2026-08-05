export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string | null;
  category: string;
  readingTime: number;
  link: string;
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  count: number;
};

export type ArticlePage = {
  items: Article[];
  page: number;
  totalPages: number;
  total: number;
};

export type Episode = {
  id: string;
  title: string;
  description: string;
  audio: string;
  date: string;
  duration: string;
  image: string | null;
  author: string;
};

export type PodcastShow = {
  title: string;
  description: string;
  image: string | null;
  author: string;
  episodes: Episode[];
};

export type Comment = {
  id: number;
  parent: number;
  author: string;
  avatar: string | null;
  date: string;
  content: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
  link: string | null;
  slug: string;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  url: string;
  author: string;
  views: number | null;
};

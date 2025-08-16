// Types for the Discover feature

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  source: string;
  author_avatar?: string;
  category: string;
  readTime: number;
  publishedAt: string;
  saved: boolean;
  bookmarked: boolean;
  // Voting fields
  upvotes: number;
  downvotes: number;
  vote_score: number;
  user_vote: 'upvote' | 'downvote' | null;
  // View tracking fields
  views: number;
  total_views: number;
  unique_views: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ContentResponse {
  data: ContentItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ContentActions {
  onSave: (id: string) => void;
  onVote: (id: string, voteType: 'upvote' | 'downvote') => void;
  onShare: (id: string) => void;
  onClick: (content: ContentItem) => void;
}

export type VoteType = 'upvote' | 'downvote';

export interface VoteData {
  upvotes: number;
  downvotes: number;
  vote_score: number;
  user_vote: VoteType | null;
}

export interface ViewData {
  views: number;
  total_views: number;
  unique_views: number;
}

export interface ArticleMetrics {
  views: ViewData;
  votes: VoteData;
  saves: number;
  shares: number;
}
// Types for Article Creation Tool

export interface Article {
  id: string;
  title: string;
  content: string;
  description: string;
  tags: string[];
  category: string;
  sources: ArticleSource[];
  is_published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  vote_score: number;
}

export interface ArticleSource {
  title: string;
  url: string;
  description?: string;
}

export interface ArticleCreateRequest {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  sources?: ArticleSource[];
  image_data?: string;
  image_alt?: string;
  image_caption?: string;
  is_published?: boolean;
}

export interface ArticleUpdateRequest {
  id: string;
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  sources?: ArticleSource[];
  image_data?: string;
  image_alt?: string;
  image_caption?: string;
  is_published?: boolean;
}

export interface ArticleResponse {
  id: string;
  title: string;
  content: string;
  description: string;
  tags: string[];
  category: string;
  sources: ArticleSource[];
  is_published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  vote_score: number;
  status: ArticleStatus;
}

export interface ArticleListResponse {
  articles: ArticleResponse[];
  total_count: number;
  has_more: boolean;
  pagination: {
    limit: number;
    offset: number;
    current_page: number;
    total_pages: number;
  };
}

export interface ArticleMetricsResponse {
  article_id: string;
  view_count: number;
  vote_score: number;
  upvotes: number;
  downvotes: number;
  save_count: number;
}

export interface ArticleVoteRequest {
  vote_type: 'upvote' | 'downvote';
}

export interface ArticleVoteResponse {
  message: string;
  vote_type: 'upvote' | 'downvote';
  new_score: number;
}

export interface ArticleSaveResponse {
  message: string;
}

export interface ArticleViewResponse {
  message: string;
  new_view_count: number;
}

export interface ArticlePublishResponse {
  message: string;
}

export interface ArticleDeleteResponse {
  message: string;
}

// Article filters for listing
export interface ArticleFilters {
  category?: string;
  tags?: string;
  is_published?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  author_id?: string;
}

// Article categories
export const ARTICLE_CATEGORIES = {
  general: 'General',
  technology: 'Technology',
  business: 'Business',
  science: 'Science',
  health: 'Health',
  entertainment: 'Entertainment',
  sports: 'Sports',
  politics: 'Politics',
  education: 'Education',
  lifestyle: 'Lifestyle'
} as const;

export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;

// Article status for UI
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticlePermissions {
  isDraft: boolean;
  isPublished: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

// Form validation types
export interface ArticleFormData {
  title: string;
  content: string;
  subtitle?: string;
  image_url?: string;
  image_alt?: string;
  image_caption?: string;
  image_data?: string;
  source_url?: string;
  read_time?: number;
  category?: string;
  tags?: string[];
  is_published?: boolean;
}

export interface ArticleFormErrors {
  title?: string;
  content?: string;
  subtitle?: string;
  image_url?: string;
  source_url?: string;
  read_time?: string;
  tags?: string;
  category?: string;
  general?: string;
}

// Editor types
export interface ArticleEditorState {
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: string;
}

// Preview types
export interface ArticlePreview {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author_id: string;
  created_at: string;
  view_count: number;
  vote_score: number;
  is_published: boolean;
}

// Search and discovery types
export interface ArticleSearchResult {
  articles: ArticlePreview[];
  total_count: number;
  search_query: string;
  filters_applied: ArticleFilters;
}

// Analytics types
export interface ArticleAnalytics {
  article_id: string;
  views_today: number;
  views_week: number;
  views_month: number;
  views_total: number;
  votes_today: number;
  votes_week: number;
  votes_month: number;
  saves_total: number;
  engagement_rate: number;
}

// Export utility types
export type CreateArticleData = Omit<Article, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'view_count' | 'vote_score'>;
export type UpdateArticleData = Partial<CreateArticleData>;
export type ArticleListItem = Pick<Article, 
  'id' | 'title' | 'description' | 'category' | 'tags' | 'is_published' | 'created_at' | 'view_count' | 'vote_score'
> & {
  status: ArticleStatus;
  image_url?: string;
  read_time?: number;
  updated_at: string;
  total_views?: number;
};
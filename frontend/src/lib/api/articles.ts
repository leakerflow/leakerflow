import { backendApi } from '@/lib/api-client';
import type {
  Article,
  ArticleCreateRequest,
  ArticleUpdateRequest,
  ArticleResponse,
  ArticleListResponse,
  ArticleMetricsResponse,
  ArticleVoteResponse,
  ArticleSaveResponse,
  ArticleViewResponse,
  ArticlePublishResponse,
  ArticleDeleteResponse,
  ArticleFilters
} from '@/types/articles';

class ArticlesApiService {
  private readonly baseUrl = '/articles';

  /**
   * Create a new article
   */
  async createArticle(data: ArticleCreateRequest): Promise<ArticleResponse> {
    const response = await backendApi.post<ArticleResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Get articles with optional filtering and pagination
   */
  async getArticles(filters: ArticleFilters = {}): Promise<ArticleListResponse> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.tags) params.append('tags', filters.tags);
    // Convert is_published to status for backend compatibility
    if (filters.is_published !== undefined) {
      params.append('status', filters.is_published ? 'published' : 'draft');
    }
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.author_id) params.append('author_id', filters.author_id);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await backendApi.get<ArticleListResponse>(url);
    return response.data;
  }

  /**
   * Get a specific article by ID
   */
  async getArticle(id: string): Promise<ArticleResponse> {
    const response = await backendApi.get<ArticleResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Update an existing article
   */
  async updateArticle(id: string, data: ArticleUpdateRequest): Promise<ArticleResponse> {
    const response = await backendApi.put<ArticleResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<ArticleDeleteResponse> {
    const response = await backendApi.delete<ArticleDeleteResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Publish an article
   */
  async publishArticle(id: string): Promise<ArticlePublishResponse> {
    const response = await backendApi.post<ArticlePublishResponse>(`${this.baseUrl}/${id}/publish`);
    return response.data;
  }

  /**
   * Unpublish an article
   */
  async unpublishArticle(id: string): Promise<ArticlePublishResponse> {
    const response = await backendApi.post<ArticlePublishResponse>(`${this.baseUrl}/${id}/unpublish`);
    return response.data;
  }

  /**
   * Get article metrics (views, votes, saves)
   */
  async getArticleMetrics(id: string): Promise<ArticleMetricsResponse> {
    const response = await backendApi.get<ArticleMetricsResponse>(`${this.baseUrl}/${id}/metrics`);
    return response.data;
  }

  /**
   * Vote on an article
   */
  async voteOnArticle(id: string, voteType: 'upvote' | 'downvote'): Promise<ArticleVoteResponse> {
    const params = new URLSearchParams({ vote_type: voteType });
    const response = await backendApi.post<ArticleVoteResponse>(`${this.baseUrl}/${id}/vote?${params.toString()}`);
    return response.data;
  }

  /**
   * Save an article to user's saved list
   */
  async saveArticle(id: string): Promise<ArticleSaveResponse> {
    const response = await backendApi.post<ArticleSaveResponse>(`${this.baseUrl}/${id}/save`);
    return response.data;
  }

  /**
   * Remove an article from user's saved list
   */
  async unsaveArticle(id: string): Promise<ArticleSaveResponse> {
    const response = await backendApi.delete<ArticleSaveResponse>(`${this.baseUrl}/${id}/save`);
    return response.data;
  }

  /**
   * Increment article view count
   */
  async incrementViews(id: string): Promise<ArticleViewResponse> {
    const response = await backendApi.post<ArticleViewResponse>(`${this.baseUrl}/${id}/view`);
    return response.data;
  }

  /**
   * Get user's own articles
   */
  async getMyArticles(filters: Omit<ArticleFilters, 'author_id'> = {}): Promise<ArticleListResponse> {
    // Get current user from Supabase session
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    return this.getArticles({ ...filters, author_id: session.user.id });
  }

  /**
   * Get published articles only
   */
  async getPublishedArticles(filters: Omit<ArticleFilters, 'is_published'> = {}): Promise<ArticleListResponse> {
    // Get current user from Supabase session
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    return this.getArticles({ ...filters, is_published: true, author_id: session.user.id });
  }

  /**
   * Get draft articles only
   */
  async getDraftArticles(filters: Omit<ArticleFilters, 'is_published'> = {}): Promise<ArticleListResponse> {
    // Get current user from Supabase session
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    return this.getArticles({ ...filters, is_published: false, author_id: session.user.id });
  }

  /**
   * Search articles by query
   */
  async searchArticles(query: string, filters: Omit<ArticleFilters, 'search'> = {}): Promise<ArticleListResponse> {
    return this.getArticles({ ...filters, search: query });
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string, filters: Omit<ArticleFilters, 'category'> = {}): Promise<ArticleListResponse> {
    return this.getArticles({ ...filters, category });
  }

  /**
   * Get articles by tags
   */
  async getArticlesByTags(tags: string[], filters: Omit<ArticleFilters, 'tags'> = {}): Promise<ArticleListResponse> {
    const tagsString = tags.join(',');
    return this.getArticles({ ...filters, tags: tagsString });
  }

  /**
   * Toggle save status of an article
   */
  async toggleSave(id: string, currentlySaved: boolean): Promise<ArticleSaveResponse> {
    if (currentlySaved) {
      return this.unsaveArticle(id);
    } else {
      return this.saveArticle(id);
    }
  }

  /**
   * Batch operations
   */
  async batchPublish(articleIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      articleIds.map(id => this.publishArticle(id))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(articleIds[index]);
      } else {
        failed.push(articleIds[index]);
      }
    });

    return { success, failed };
  }

  async batchUnpublish(articleIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      articleIds.map(id => this.unpublishArticle(id))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(articleIds[index]);
      } else {
        failed.push(articleIds[index]);
      }
    });

    return { success, failed };
  }

  async batchDelete(articleIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      articleIds.map(id => this.deleteArticle(id))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(articleIds[index]);
      } else {
        failed.push(articleIds[index]);
      }
    });

    return { success, failed };
  }
}

// Export singleton instance
export const articlesApiService = new ArticlesApiService();

// Export class for testing or custom instances
export { ArticlesApiService };

// Export default
export default articlesApiService;
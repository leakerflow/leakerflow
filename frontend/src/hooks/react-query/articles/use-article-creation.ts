import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { articlesApiService } from '@/lib/api/articles';
import type {
  ArticleCreateRequest,
  ArticleUpdateRequest,
  ArticleResponse,
  ArticleListResponse,
  ArticleMetricsResponse,
  ArticleFilters
} from '@/types/articles';
import { toast } from 'sonner';

// Query keys for article creation tool
export const articleCreationKeys = {
  all: ['article-creation'] as const,
  lists: () => [...articleCreationKeys.all, 'list'] as const,
  list: (filters: ArticleFilters) => [...articleCreationKeys.lists(), filters] as const,
  details: () => [...articleCreationKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleCreationKeys.details(), id] as const,
  metrics: (id: string) => [...articleCreationKeys.all, 'metrics', id] as const,
  myArticles: () => [...articleCreationKeys.all, 'my-articles'] as const,
  drafts: () => [...articleCreationKeys.all, 'drafts'] as const,
  published: () => [...articleCreationKeys.all, 'published'] as const,
};

// Hook to create a new article
export function useCreateArticle() {
  const queryClient = useQueryClient();
  // Using sonner toast directly

  return useMutation({
    mutationFn: (data: ArticleCreateRequest) => articlesApiService.createArticle(data),
    onSuccess: (newArticle) => {
      // Invalidate and refetch articles lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      
      // Add the new article to cache
      queryClient.setQueryData(articleCreationKeys.detail(newArticle.id), newArticle);
      
      toast.success(`"${newArticle.title}" has been created successfully.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create article. Please try again.');
    },
  });
}

// Hook to update an existing article
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArticleUpdateRequest }) => 
      articlesApiService.updateArticle(id, data),
    onSuccess: (updatedArticle, { id }) => {
      // Update the article in cache
      queryClient.setQueryData(articleCreationKeys.detail(id), updatedArticle);
      
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success(`"${updatedArticle.title}" has been updated successfully.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update article. Please try again.');
    },
  });
}

// Hook to delete an article
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApiService.deleteArticle(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: articleCreationKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success('Article has been deleted successfully.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete article. Please try again.');
    },
  });
}

// Hook to publish an article
export function usePublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApiService.publishArticle(id),
    onSuccess: (_, id) => {
      // Update article status in cache
      queryClient.setQueryData(articleCreationKeys.detail(id), (old: ArticleResponse | undefined) => {
        if (old) {
          return { ...old, is_published: true };
        }
        return old;
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success('Article has been published successfully.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to publish article. Please try again.');
    },
  });
}

// Hook to unpublish an article
export function useUnpublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApiService.unpublishArticle(id),
    onSuccess: (_, id) => {
      // Update article status in cache
      queryClient.setQueryData(articleCreationKeys.detail(id), (old: ArticleResponse | undefined) => {
        if (old) {
          return { ...old, is_published: false };
        }
        return old;
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success('Article has been unpublished successfully.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unpublish article. Please try again.');
    },
  });
}

// Hook to get articles with filters
export function useArticlesList(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: articleCreationKeys.list(filters),
    queryFn: () => articlesApiService.getArticles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a single article
export function useArticleDetail(id: string) {
  return useQuery({
    queryKey: articleCreationKeys.detail(id),
    queryFn: () => articlesApiService.getArticle(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get user's own articles
export function useMyArticles(filters: Omit<ArticleFilters, 'author_id'> = {}) {
  return useQuery({
    queryKey: articleCreationKeys.myArticles(),
    queryFn: () => articlesApiService.getMyArticles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get draft articles
export function useDraftArticles(filters: Omit<ArticleFilters, 'is_published'> = {}) {
  return useQuery({
    queryKey: articleCreationKeys.drafts(),
    queryFn: () => articlesApiService.getDraftArticles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get published articles
export function usePublishedArticles(filters: Omit<ArticleFilters, 'is_published'> = {}) {
  return useQuery({
    queryKey: articleCreationKeys.published(),
    queryFn: () => articlesApiService.getPublishedArticles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get article metrics
export function useArticleMetrics(id: string) {
  return useQuery({
    queryKey: articleCreationKeys.metrics(id),
    queryFn: () => articlesApiService.getArticleMetrics(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to vote on article
export function useVoteOnArticleCreation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, voteType }: { id: string; voteType: 'upvote' | 'downvote' }) => 
      articlesApiService.voteOnArticle(id, voteType),
    onSuccess: (data, { id }) => {
      // Update article in cache
      queryClient.setQueryData(articleCreationKeys.detail(id), (old: ArticleResponse | undefined) => {
        if (old) {
          return { ...old, vote_score: data.new_score };
        }
        return old;
      });
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.metrics(id) });
      
      toast.success(`Your ${data.vote_type} has been recorded.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to record vote. Please try again.');
    },
  });
}

// Hook to save/unsave article
export function useSaveArticleCreation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentlySaved }: { id: string; currentlySaved: boolean }) => 
      articlesApiService.toggleSave(id, currentlySaved),
    onSuccess: (data, { id, currentlySaved }) => {
      const action = currentlySaved ? 'removed from' : 'added to';
      
      toast.success(`Article has been ${action} your saved list.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save article. Please try again.');
    },
  });
}

// Hook to increment views
export function useIncrementArticleViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApiService.incrementViews(id),
    onSuccess: (data, id) => {
      // Update article in cache
      queryClient.setQueryData(articleCreationKeys.detail(id), (old: ArticleResponse | undefined) => {
        if (old) {
          return { ...old, view_count: data.new_view_count };
        }
        return old;
      });
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.metrics(id) });
    },
    // Silent operation - no toast notifications
  });
}

// Hook for batch operations
export function useBatchPublishArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: string[]) => articlesApiService.batchPublish(articleIds),
    onSuccess: (result) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success(`${result.success.length} articles published successfully. ${result.failed.length} failed.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to publish articles. Please try again.');
    },
  });
}

export function useBatchUnpublishArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: string[]) => articlesApiService.batchUnpublish(articleIds),
    onSuccess: (result) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success(`${result.success.length} articles unpublished successfully. ${result.failed.length} failed.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unpublish articles. Please try again.');
    },
  });
}

export function useBatchDeleteArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: string[]) => articlesApiService.batchDelete(articleIds),
    onSuccess: (result) => {
      // Remove from cache
      result.success.forEach(id => {
        queryClient.removeQueries({ queryKey: articleCreationKeys.detail(id) });
      });
      
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.myArticles() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: articleCreationKeys.published() });
      
      toast.success(`${result.success.length} articles deleted successfully. ${result.failed.length} failed.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete articles. Please try again.');
    },
  });
}

// Utility hook for auto-saving drafts
export function useAutoSaveArticle(id: string, enabled: boolean = true) {
  const updateArticle = useUpdateArticle();
  
  const autoSave = useCallback((data: ArticleUpdateRequest) => {
    if (enabled && id) {
      updateArticle.mutate({ id, data });
    }
  }, [enabled, id, updateArticle]);
  
  return {
    autoSave,
    isSaving: updateArticle.isPending,
    lastSaved: updateArticle.isSuccess ? new Date() : null,
  };
}
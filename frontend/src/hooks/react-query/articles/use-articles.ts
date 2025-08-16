import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { articlesService } from '@/lib/supabase/articles';
import type { ContentItem } from '@/components/discover/types';

// Query keys
export const articlesKeys = {
  all: ['articles'] as const,
  lists: () => [...articlesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...articlesKeys.lists(), filters] as const,
  details: () => [...articlesKeys.all, 'detail'] as const,
  detail: (id: string) => [...articlesKeys.details(), id] as const,
  metrics: (id: string) => [...articlesKeys.all, 'metrics', id] as const,
  activeUsers: () => [...articlesKeys.all, 'activeUsers'] as const,
};

// Hook to fetch articles
export function useArticles(filters: { status?: string } = {}) {
  return useQuery({
    queryKey: articlesKeys.list(filters),
    queryFn: () => articlesService.getArticles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch single article
export function useArticle(id: string) {
  return useQuery({
    queryKey: articlesKeys.detail(id),
    queryFn: () => articlesService.getArticle(id),
    enabled: !!id,
  });
}

// Hook to save/unsave article
export function useSaveArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleId: string) => articlesService.toggleSave(articleId),
    onSuccess: (data, articleId) => {
      // Update the article in cache
      queryClient.setQueryData(articlesKeys.detail(articleId), (old: any) => {
        if (old) {
          return { ...old, saved: (data as any).saved, bookmarked: (data as any).saved };
        }
        return old;
      });
      
      // Invalidate articles list to refresh
      queryClient.invalidateQueries({ queryKey: articlesKeys.lists() });
    },
  });
}

// Hook to vote on article
export function useVoteOnArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ articleId, voteType }: { articleId: string; voteType: 'upvote' | 'downvote' }) => 
      articlesService.vote(articleId, voteType),
    onSuccess: (data, { articleId }) => {
      // Update the article in cache
      queryClient.setQueryData(articlesKeys.detail(articleId), (old: any) => {
        if (old) {
          return { 
            ...old, 
            upvotes: (data as any).upvotes,
            downvotes: (data as any).downvotes,
            vote_score: (data as any).vote_score,
            user_vote: (data as any).user_vote
          };
        }
        return old;
      });
      
      // Invalidate articles list to refresh
      queryClient.invalidateQueries({ queryKey: articlesKeys.lists() });
    },
  });
}

// Hook to increment views
export function useIncrementViews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleId: string) => articlesService.incrementViews(articleId),
    onSuccess: (data, articleId) => {
      // Update the article in cache
      queryClient.setQueryData(articlesKeys.detail(articleId), (old: any) => {
        if (old) {
          return { 
            ...old, 
            views: (data as any).views,
            total_views: (data as any).total_views,
            unique_views: (data as any).unique_views
          };
        }
        return old;
      });
    },
  });
}

// Hook to auto-track views when article is loaded
export function useAutoTrackView(articleId: string, enabled: boolean) {
  const incrementViewsMutation = useIncrementViews();
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (enabled && articleId && !hasTracked.current) {
      hasTracked.current = true;
      incrementViewsMutation.mutate(articleId);
    }
  }, [enabled, articleId, incrementViewsMutation]);
}

// Hook to track article viewing activity (real-time)
export function useTrackArticleViewing(articleId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !articleId) return;
    
    // Track that user is viewing this article
    const startViewing = () => articlesService.startViewing(articleId);
    const stopViewing = () => articlesService.stopViewing(articleId);
    
    startViewing();
    
    // Stop viewing when component unmounts or user leaves
    return () => {
      stopViewing();
    };
  }, [articleId, enabled]);
}

// Hook to get article metrics
export function useArticleMetrics(articleId: string) {
  const queryClient = useQueryClient();
  
  const trackShare = () => {
    return articlesService.trackShare(articleId);
  };
  
  return {
    trackShare,
  };
}

// Hook to get global active users
export function useGlobalActiveUsers() {
  return useQuery({
    queryKey: articlesKeys.activeUsers(),
    queryFn: () => articlesService.getGlobalActiveUsers(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to subscribe to global activity updates
export function useGlobalActivitySubscription() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = articlesService.subscribeToGlobalActivity((data) => {
      queryClient.setQueryData(articlesKeys.activeUsers(), data);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);
}
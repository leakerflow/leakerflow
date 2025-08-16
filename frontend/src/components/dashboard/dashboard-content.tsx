'use client';

import React, { useState, Suspense, useEffect, useRef, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChatInput,
  ChatInputHandles,
} from '@/components/thread/chat-input/chat-input';
import {
  BillingError,
  AgentRunLimitError,
} from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBillingError } from '@/hooks/useBillingError';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { useAccounts } from '@/hooks/use-accounts';
import { config, isLocalMode, isStagingMode } from '@/lib/config';
import { useInitiateAgentWithInvalidation } from '@/hooks/react-query/dashboard/use-initiate-agent';
import { ModalProviders } from '@/providers/modal-providers';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { cn } from '@/lib/utils';
import { useModal } from '@/hooks/use-modal-store';
import { useAgentSelection } from '@/lib/stores/agent-selection-store';
import { Examples } from './examples';
import { useThreadQuery } from '@/hooks/react-query/threads/use-threads';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';
import { LeakerFlowLogo } from '../sidebar/leakerflow-logo';
import { AgentRunLimitDialog } from '@/components/thread/agent-run-limit-dialog';
import { useFeatureFlag } from '@/lib/feature-flags';
import { CustomAgentsSection } from './custom-agents-section';
import { toast } from 'sonner';
import { ReleaseBadge } from '../auth/release-badge';
import { 
  ContentHero, 
  ContentStream, 
  DiscoverHeader 
} from '@/components/discover';
import type { ContentItem } from '@/components/discover/types';
import { useArticles, useSaveArticle, useIncrementViews, useVoteOnArticle } from '@/hooks/react-query/articles/use-articles';

// Tab categories mapping
export const TAB_CATEGORIES = {
  'for-you': 'for-you',
  'trends': 'trends', 
  'official': 'official',
  'rumor': 'rumor',
  'community': 'community'
} as const;

export type TabCategory = keyof typeof TAB_CATEGORIES;

// Convert Supabase article to ContentItem format (memoized)
const convertArticleToContentItem = (article: any): ContentItem => ({
  id: article.id,
  title: article.title,
  subtitle: article.subtitle,
  imageUrl: article.image_url || '/api/placeholder/400/250',
  source: article.author,
  author_avatar: article.author_avatar,
  category: article.category,
  readTime: article.read_time,
  publishedAt: article.publish_date || article.created_at,
  saved: article.saved || article.bookmarked,
  bookmarked: article.bookmarked, // Keep for backward compatibility
  // Voting fields
  upvotes: article.upvotes || 0,
  downvotes: article.downvotes || 0,
  vote_score: article.vote_score || 0,
  user_vote: article.user_vote || null,
  // View tracking fields - properly handle views
  views: article.views || article.total_views || 0,
  total_views: article.total_views || article.views || 0,
  unique_views: article.unique_views || article.total_views || article.views || 0,
});

// Optimized chunking utility with memoization
const chunkContent = (content: ContentItem[]) => {
  return content.reduce<ContentItem[][]>((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 4);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
};

const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

export function DashboardContent() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const { 
    selectedAgentId, 
    setSelectedAgent, 
    initializeFromAgents,
    getCurrentAgent
  } = useAgentSelection();
  const [initiatedThreadId, setInitiatedThreadId] = useState<string | null>(null);
  const { billingError, handleBillingError, clearBillingError } =
    useBillingError();
  const [showAgentLimitDialog, setShowAgentLimitDialog] = useState(false);
  const [agentLimitData, setAgentLimitData] = useState<{
    runningCount: number;
    runningThreadIds: string[];
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const chatInputRef = useRef<ChatInputHandles>(null);
  const initiateAgentMutation = useInitiateAgentWithInvalidation();
  const { onOpen } = useModal();

  // Discover states
  const [activeTab, setActiveTab] = useState<TabCategory>('for-you');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [votedArticles, setVotedArticles] = useState<Map<string, 'upvote' | 'downvote'>>(new Map());
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Discover queries - fetch published articles from Supabase
  const { 
    data: articlesData, 
    isLoading
  } = useArticles({ status: 'published' });
  const saveArticleMutation = useSaveArticle();
  const incrementViewsMutation = useIncrementViews();
  const voteArticleMutation = useVoteOnArticle();

  // Discover callbacks
  const handleSaveArticle = useCallback(async (articleId: string) => {
    try {
      await saveArticleMutation.mutateAsync(articleId);
      setSavedArticles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(articleId)) {
          newSet.delete(articleId);
        } else {
          newSet.add(articleId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    }
  }, [saveArticleMutation]);

  // Handle voting on articles - NO local state management, rely on React Query
  const handleVote = useCallback(async (articleId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await voteArticleMutation.mutateAsync({ 
        articleId, 
        voteType 
      });
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }, [voteArticleMutation]);

  // Handle save toggle - NO local state management, rely on React Query
  const handleSaveToggle = useCallback(async (contentId: string) => {
    try {
      await saveArticleMutation.mutateAsync(contentId);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  }, [saveArticleMutation]);

  const handleContentClick = useCallback(async (content: ContentItem) => {
    try {
      await incrementViewsMutation.mutateAsync(content.id);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }, [incrementViewsMutation]);

  const handleArticleView = useCallback(async (articleId: string) => {
    if (!viewedArticles.has(articleId)) {
      try {
        await incrementViewsMutation.mutateAsync(articleId);
        setViewedArticles(prev => new Set([...prev, articleId]));
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    }
  }, [viewedArticles, incrementViewsMutation]);

  // Memoized article conversion and filtering by active tab
  const { convertedArticles, filteredArticles } = useMemo(() => {
    const allArticles = articlesData || [];
    
    // Remove duplicates by article ID first
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.id, article])).values()
    );
    
    const converted = uniqueArticles.map(convertArticleToContentItem);
    
    // Filter articles by active tab category
    const filtered = activeTab === 'for-you' 
      ? converted // For You shows all articles
      : activeTab === 'trends'
        ? converted.filter(article => article.vote_score && article.vote_score > 0) // Trends shows articles with positive vote score
        : converted.filter(article => article.category === TAB_CATEGORIES[activeTab]);
    
    return { convertedArticles: converted, filteredArticles: filtered };
  }, [articlesData, activeTab]);

  // Load more content function - simplified to always show more content
  const loadMoreContent = useCallback(async () => {
    if (isLoading) return;

    try {
      if (filteredArticles.length > 0) {
        // Cycle through existing articles
        setCurrentCycle(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load more content:', error);
    }
  }, [isLoading, filteredArticles.length]);

  // Handle tab changes
  const handleTabChange = useCallback((tab: TabCategory) => {
    setActiveTab(tab);
    setCurrentCycle(0); // Reset cycle when switching tabs
  }, []);

  // Intersection observer setup
  useEffect(() => {
    const createObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreContent();
          }
        },
        { 
          threshold: 0.1,
          rootMargin: '100px' // Start loading before user reaches the end
        }
      );

      if (sentinelRef.current) {
        observerRef.current.observe(sentinelRef.current);
      }
    };

    createObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreContent]);

  // Calculate how many articles to show based on cycles - simplified approach
  const articlesToShow = useMemo(() => {
    if (filteredArticles.length === 0) return [];
    
    // Start with showing 12 articles or all available articles if less than 12
    const baseArticles = Math.min(12, filteredArticles.length);
    const additionalArticles = currentCycle * 4; // Each cycle adds 4 more articles
    const totalToShow = baseArticles + additionalArticles;
    
    // If we need more articles than available, cycle through them
    if (totalToShow <= filteredArticles.length) {
      return filteredArticles.slice(0, totalToShow);
    } else {
      // Create a cycling array by repeating articles
      const cycles = Math.ceil(totalToShow / filteredArticles.length);
      const repeatedArticles = Array(cycles).fill(filteredArticles).flat();
      return repeatedArticles.slice(0, totalToShow);
    }
  }, [filteredArticles, currentCycle]);

  // Memoized chunked content
  const chunkedContent = useMemo(() => 
    chunkContent(articlesToShow), 
    [articlesToShow]
  );

  // Memoized loading states
  const isInitialLoading = isLoading && filteredArticles.length === 0;
  const isLoadingMoreContent = false;
  const showCycleIndicator = filteredArticles.length > 0 && currentCycle > 0 && articlesToShow.length > filteredArticles.length;

  // Feature flag for custom agents section
  const { enabled: customAgentsEnabled } = useFeatureFlag('custom_agents');

  // Fetch agents to get the selected agent's name
  const { data: agentsResponse } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });

  const agents = agentsResponse?.agents || [];
  const selectedAgent = selectedAgentId
    ? agents.find(agent => agent.agent_id === selectedAgentId)
    : null;
  const displayName = selectedAgent?.name || 'Leaker Flow';
  const agentAvatar = undefined;
  const isLeakerFlowAgent = selectedAgent?.metadata?.is_leakerflow_default || false;

  const threadQuery = useThreadQuery(initiatedThreadId || '');

  const enabledEnvironment = isStagingMode() || isLocalMode();

  useEffect(() => {
    console.log('🚀 Dashboard effect:', { 
      agentsLength: agents.length, 
      selectedAgentId, 
      agents: agents.map(a => ({ id: a.agent_id, name: a.name, isDefault: a.metadata?.is_leakerflow_default })) 
    });
    
    if (agents.length > 0) {
      console.log('📞 Calling initializeFromAgents');
      initializeFromAgents(agents, undefined, setSelectedAgent);
    }
  }, [agents, initializeFromAgents, setSelectedAgent]);

  useEffect(() => {
    const agentIdFromUrl = searchParams.get('agent_id');
    if (agentIdFromUrl && agentIdFromUrl !== selectedAgentId) {
      setSelectedAgent(agentIdFromUrl);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('agent_id');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, selectedAgentId, router, setSelectedAgent]);

  useEffect(() => {
    if (threadQuery.data && initiatedThreadId) {
      const thread = threadQuery.data;
      if (thread.project_id) {
        router.push(`/projects/${thread.project_id}/thread/${initiatedThreadId}`);
      } else {
        router.push(`/agents/${initiatedThreadId}`);
      }
      setInitiatedThreadId(null);
    }
  }, [threadQuery.data, initiatedThreadId, router]);

  const handleSubmit = async (
    message: string,
    options?: {
      model_name?: string;
      enable_thinking?: boolean;
      reasoning_effort?: string;
      stream?: boolean;
      enable_context_manager?: boolean;
    },
  ) => {
    if (
      (!message.trim() && !chatInputRef.current?.getPendingFiles().length) ||
      isSubmitting
    )
      return;

    setIsSubmitting(true);

    try {
      const files = chatInputRef.current?.getPendingFiles() || [];
      localStorage.removeItem(PENDING_PROMPT_KEY);

      const formData = new FormData();
      formData.append('prompt', message);

      // Add selected agent if one is chosen
      if (selectedAgentId) {
        formData.append('agent_id', selectedAgentId);
      }

      files.forEach((file, index) => {
        const normalizedName = normalizeFilenameToNFC(file.name);
        formData.append('files', file, normalizedName);
      });

      if (options?.model_name) formData.append('model_name', options.model_name);
      formData.append('enable_thinking', String(options?.enable_thinking ?? false));
      formData.append('reasoning_effort', options?.reasoning_effort ?? 'low');
      formData.append('stream', String(options?.stream ?? true));
      formData.append('enable_context_manager', String(options?.enable_context_manager ?? false));

      const result = await initiateAgentMutation.mutateAsync(formData);

      if (result.thread_id) {
        setInitiatedThreadId(result.thread_id);
      } else {
        throw new Error('Agent initiation did not return a thread_id.');
      }
      chatInputRef.current?.clearPendingFiles();
    } catch (error: any) {
      console.error('Error during submission process:', error);
      if (error instanceof BillingError) {
        onOpen("paymentRequiredDialog");
      } else if (error instanceof AgentRunLimitError) {
        const { running_thread_ids, running_count } = error.detail;
        setAgentLimitData({
          runningCount: running_count,
          runningThreadIds: running_thread_ids,
        });
        setShowAgentLimitDialog(true);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Operation failed';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);

      if (pendingPrompt) {
        setInputValue(pendingPrompt);
        setAutoSubmit(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoSubmit && inputValue && !isSubmitting) {
      const timer = setTimeout(() => {
        handleSubmit(inputValue);
        setAutoSubmit(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoSubmit, inputValue, isSubmitting]);

  return (
    <>
      <ModalProviders />
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Discover Header - Fixed at top */}
        <DiscoverHeader activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* CTA Element - Directly below navigation */}
        {customAgentsEnabled && (
          <div className="flex justify-center px-4 pt-4 md:pt-8">
            <ReleaseBadge text="Custom Agents, Workflows, and more!" link="/agents?tab=my-agents" />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col mt-[20vh]">
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-[650px] flex flex-col items-center justify-center space-y-4 md:space-y-6">
                <div className="flex flex-col items-center text-center w-full">
                  <p className="tracking-tight text-2xl md:text-3xl font-normal text-muted-foreground/80">
                    What would you like to do today?
                  </p>
                </div>
                <div className="w-full">
                  <ChatInput
                    ref={chatInputRef}
                    onSubmit={handleSubmit}
                    loading={isSubmitting}
                    placeholder="Describe what you need help with..."
                    value={inputValue}
                    onChange={setInputValue}
                    hideAttachments={false}
                    selectedAgentId={selectedAgentId}
                    onAgentSelect={setSelectedAgent}
                    enableAdvancedConfig={true}
                    onConfigureAgent={(agentId) => router.push(`/agents/config/${agentId}`)}
                  />
                </div>
                <div className="w-full">
                  <Examples onSelectPrompt={setInputValue} count={isMobile ? 3 : 4} />
                </div>
              </div>
            </div>
            {enabledEnvironment && customAgentsEnabled && (
              <div className="w-full px-4 pb-8">
                <div className="max-w-7xl mx-auto">
                  <CustomAgentsSection 
                    onAgentSelect={setSelectedAgent}
                  />
                </div>
              </div>
            )}
            
            {/* Discover Section */}
            <div className="w-full px-4 pb-8">
              <div className="max-w-7xl mx-auto">
                <main className="pb-16 pt-12">
                  {isInitialLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  ) : articlesToShow.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <h2 className="text-2xl font-bold mb-4">
                        {activeTab === 'for-you' ? 'No Articles Available' : 
                         activeTab === 'trends' ? 'No Trending Articles' :
                         `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Articles`}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {activeTab === 'for-you' 
                          ? 'There are no published articles yet. Check back later or create some articles!'
                          : activeTab === 'trends'
                          ? 'No articles are trending yet. Vote on articles to help them trend!'
                          : `There are no ${activeTab} articles available yet. Try another category or create some articles!`
                        }
                      </p>
                      <Link 
                        href="/articles/editor" 
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Create Your First Article
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {chunkedContent.map((chunk, index) => (
                        <section key={`chunk-${index}-${chunk[0]?.id || index}`} className="space-y-6">
                          {chunk[0] && (
                            <ContentHero
                              content={chunk[0]}
                              onSaveToggle={() => handleSaveToggle(chunk[0].id)}
                              onVote={(voteType) => handleVote(chunk[0].id, voteType)}
                            />
                          )}
                          {chunk.length > 1 && (
                            <ContentStream
                              content={chunk.slice(1)}
                              onSaveToggle={handleSaveToggle}
                              onVote={handleVote}
                            />
                          )}
                        </section>
                      ))}
                    </div>
                  )}
                  
                  <div ref={sentinelRef} className="h-10" />

                  {isLoadingMoreContent && (
                    <div className="flex justify-center items-center py-6">
                      <div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  )}

                  {showCycleIndicator && process.env.NODE_ENV === 'development' && (
                    <div className="flex justify-center items-center py-6">
                      <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        Showing articles again • Cycle {currentCycle + 1}
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </div>
          </div>
        </div>
        
        <BillingErrorAlert
          message={billingError?.message}
          currentUsage={billingError?.currentUsage}
          limit={billingError?.limit}
          accountId={personalAccount?.account_id}
          onDismiss={clearBillingError}
          isOpen={!!billingError}
        />
      </div>

      {agentLimitData && (
        <AgentRunLimitDialog
          open={showAgentLimitDialog}
          onOpenChange={setShowAgentLimitDialog}
          runningCount={agentLimitData.runningCount}
          runningThreadIds={agentLimitData.runningThreadIds}
          projectId={undefined}
        />
      )}
    </>
  );
}

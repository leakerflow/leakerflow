import { createClient } from '@/lib/supabase/client';
import type { ContentItem, VoteType } from '@/components/discover/types';

class ArticlesService {
  private supabase = createClient();

  async getArticles(filters: { status?: string } = {}) {
    let query = this.supabase
      .from('articles')
      .select(`
        *,
        saved:user_article_saves!left(user_id),
        user_vote:article_votes!left(vote_type)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }

    return data || [];
  }

  async getArticle(id: string) {
    const { data, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        saved:user_article_saves!left(user_id),
        user_vote:article_votes!left(vote_type)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }

    return data;
  }

  async toggleSave(articleId: string) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if already saved
    const { data: existing } = await this.supabase
      .from('user_article_saves')
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove save
      const { error } = await this.supabase
        .from('user_article_saves')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to unsave article: ${error.message}`);
      }

      return { saved: false };
    } else {
      // Add save
      const { error } = await this.supabase
        .from('user_article_saves')
        .insert({
          article_id: articleId,
          user_id: user.id
        });

      if (error) {
        throw new Error(`Failed to save article: ${error.message}`);
      }

      return { saved: true };
    }
  }

  async vote(articleId: string, voteType: VoteType) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user already voted
    const { data: existingVote } = await this.supabase
      .from('article_votes')
      .select('vote_type')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if same type
        const { error } = await this.supabase
          .from('article_votes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Failed to remove vote: ${error.message}`);
        }
      } else {
        // Update vote if different type
        const { error } = await this.supabase
          .from('article_votes')
          .update({ vote_type: voteType })
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Failed to update vote: ${error.message}`);
        }
      }
    } else {
      // Insert new vote
      const { error } = await this.supabase
        .from('article_votes')
        .insert({
          article_id: articleId,
          user_id: user.id,
          vote_type: voteType
        });

      if (error) {
        throw new Error(`Failed to vote: ${error.message}`);
      }
    }

    // Get updated vote counts
    const { data: voteCounts } = await this.supabase
      .rpc('get_article_vote_counts', { article_id: articleId });

    return voteCounts;
  }

  async incrementViews(articleId: string) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    // Track view
    const { error } = await this.supabase
      .from('article_views')
      .insert({
        article_id: articleId,
        user_id: user?.id || null,
        ip_address: null, // Will be handled by backend
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.warn('Failed to track view:', error.message);
    }

    // Get updated view counts
    const { data: viewCounts } = await this.supabase
      .rpc('get_article_view_counts', { article_id: articleId });

    return viewCounts || { views: 0, total_views: 0, unique_views: 0 };
  }

  async startViewing(articleId: string) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await this.supabase
      .from('article_active_viewers')
      .upsert({
        article_id: articleId,
        user_id: user.id,
        last_seen: new Date().toISOString()
      });

    if (error) {
      console.warn('Failed to track active viewing:', error.message);
    }
  }

  async stopViewing(articleId: string) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await this.supabase
      .from('article_active_viewers')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', user.id);

    if (error) {
      console.warn('Failed to stop tracking viewing:', error.message);
    }
  }

  async trackShare(articleId: string) {
    const { error } = await this.supabase
      .from('article_shares')
      .insert({
        article_id: articleId,
        shared_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Failed to track share:', error.message);
    }
  }

  async getGlobalActiveUsers() {
    const { data, error } = await this.supabase
      .from('article_active_viewers')
      .select('user_id, last_seen')
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    if (error) {
      console.warn('Failed to get active users:', error.message);
      return { count: 0, users: [] };
    }

    return {
      count: data?.length || 0,
      users: data || []
    };
  }

  subscribeToGlobalActivity(callback: (data: any) => void) {
    const subscription = this.supabase
      .channel('global_activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_active_viewers'
        },
        () => {
          // Refetch active users when changes occur
          this.getGlobalActiveUsers().then(callback);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const articlesService = new ArticlesService();
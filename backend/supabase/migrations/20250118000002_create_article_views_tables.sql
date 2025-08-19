-- Migration: Create article views and active viewers tables
-- This migration creates the article_views and article_active_viewers tables for tracking article engagement

BEGIN;

-- Create article_views table for tracking individual article views
CREATE TABLE IF NOT EXISTS public.article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id TEXT,
    view_duration INTEGER DEFAULT 0 -- in seconds
);

-- Create article_active_viewers table for tracking currently active viewers
CREATE TABLE IF NOT EXISTS public.article_active_viewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON public.article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON public.article_views(created_at);
CREATE INDEX IF NOT EXISTS idx_article_views_session_id ON public.article_views(session_id);

CREATE INDEX IF NOT EXISTS idx_article_active_viewers_user_id ON public.article_active_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_article_active_viewers_article_id ON public.article_active_viewers(article_id);
CREATE INDEX IF NOT EXISTS idx_article_active_viewers_last_seen ON public.article_active_viewers(last_seen);

-- Enable Row Level Security
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_active_viewers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for article_views
CREATE POLICY "Users can view their own article views" ON public.article_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own article views" ON public.article_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for article_active_viewers
CREATE POLICY "Users can view their own active viewing sessions" ON public.article_active_viewers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own active viewing sessions" ON public.article_active_viewers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active viewing sessions" ON public.article_active_viewers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active viewing sessions" ON public.article_active_viewers
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update article view count
CREATE OR REPLACE FUNCTION update_article_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update view_count in articles table
    UPDATE public.articles 
    SET view_count = (
        SELECT COUNT(DISTINCT user_id) FROM public.article_views 
        WHERE article_id = NEW.article_id
    )
    WHERE id = NEW.article_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update article view count
CREATE TRIGGER trigger_update_article_view_count
    AFTER INSERT ON public.article_views
    FOR EACH ROW
    EXECUTE FUNCTION update_article_view_count();

-- Create function to clean up old active viewers (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_inactive_viewers()
RETURNS void AS $$
BEGIN
    DELETE FROM public.article_active_viewers 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to get article view counts
CREATE OR REPLACE FUNCTION get_article_view_counts(article_ids UUID[])
RETURNS TABLE(article_id UUID, view_count BIGINT, active_viewers BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as article_id,
        COALESCE(v.view_count, 0) as view_count,
        COALESCE(av.active_viewers, 0) as active_viewers
    FROM unnest(article_ids) as a(id)
    LEFT JOIN (
        SELECT 
            article_id,
            COUNT(DISTINCT user_id) as view_count
        FROM public.article_views
        WHERE article_id = ANY(article_ids)
        GROUP BY article_id
    ) v ON v.article_id = a.id
    LEFT JOIN (
        SELECT 
            article_id,
            COUNT(*) as active_viewers
        FROM public.article_active_viewers
        WHERE article_id = ANY(article_ids)
        AND last_seen > NOW() - INTERVAL '5 minutes'
        GROUP BY article_id
    ) av ON av.article_id = a.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION get_article_view_counts(UUID[]) TO authenticated;

COMMIT;
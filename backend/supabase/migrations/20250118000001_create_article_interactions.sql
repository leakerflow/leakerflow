-- Migration: Create article interaction tables (saves and votes)
-- This migration creates the user_article_saves and article_votes tables

BEGIN;

-- Create user_article_saves table for bookmarking articles
CREATE TABLE IF NOT EXISTS public.user_article_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Create article_votes table for upvotes/downvotes
CREATE TABLE IF NOT EXISTS public.article_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_article_saves_user_id ON public.user_article_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_article_saves_article_id ON public.user_article_saves(article_id);
CREATE INDEX IF NOT EXISTS idx_article_votes_user_id ON public.article_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_votes_article_id ON public.article_votes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_votes_vote_type ON public.article_votes(vote_type);

-- Enable Row Level Security
ALTER TABLE public.user_article_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_article_saves
CREATE POLICY "Users can view their own saves" ON public.user_article_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" ON public.user_article_saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON public.user_article_saves
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for article_votes
CREATE POLICY "Users can view their own votes" ON public.article_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own votes" ON public.article_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.article_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.article_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions to update article statistics
CREATE OR REPLACE FUNCTION update_article_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update like_count in articles table based on votes
    UPDATE public.articles 
    SET like_count = (
        SELECT COUNT(*) FROM public.article_votes 
        WHERE article_id = COALESCE(NEW.article_id, OLD.article_id) 
        AND vote_type = 'upvote'
    ) - (
        SELECT COUNT(*) FROM public.article_votes 
        WHERE article_id = COALESCE(NEW.article_id, OLD.article_id) 
        AND vote_type = 'downvote'
    )
    WHERE id = COALESCE(NEW.article_id, OLD.article_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update article statistics
CREATE TRIGGER trigger_update_article_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.article_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_vote_counts();

COMMIT;
-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_updated_at_user_article_saves()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at_user_article_saves
    BEFORE UPDATE ON user_article_saves
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_user_article_saves();

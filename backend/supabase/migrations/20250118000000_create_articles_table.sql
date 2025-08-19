-- Migration: Create articles table for Discover platform
-- This migration creates the articles table with all necessary fields and indexes

BEGIN;

-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    author_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    sources JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_sources ON public.articles USING GIN(sources);
CREATE INDEX IF NOT EXISTS idx_articles_metadata ON public.articles USING GIN(metadata);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON public.articles USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content)
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION update_articles_updated_at();

-- Create function to automatically set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_articles_published_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is changing to published and published_at is null, set it
    IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    
    -- If status is changing from published to something else, keep published_at
    -- (don't clear it, as it represents when it was first published)
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for published_at
CREATE TRIGGER trigger_articles_published_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION set_articles_published_at();

-- Add comments for documentation
COMMENT ON TABLE public.articles IS 'Articles for the Discover platform';
COMMENT ON COLUMN public.articles.id IS 'Unique identifier for the article';
COMMENT ON COLUMN public.articles.title IS 'Article title';
COMMENT ON COLUMN public.articles.content IS 'Article content in markdown format';
COMMENT ON COLUMN public.articles.description IS 'Brief description or summary of the article';
COMMENT ON COLUMN public.articles.author_id IS 'ID of the user who created the article';
COMMENT ON COLUMN public.articles.category IS 'Article category (e.g., tech, science, business)';
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN public.articles.sources IS 'JSON array of sources and references';
COMMENT ON COLUMN public.articles.status IS 'Article status: draft, published, or archived';
COMMENT ON COLUMN public.articles.published_at IS 'Timestamp when the article was first published';
COMMENT ON COLUMN public.articles.view_count IS 'Number of times the article has been viewed';
COMMENT ON COLUMN public.articles.like_count IS 'Number of likes the article has received';
COMMENT ON COLUMN public.articles.share_count IS 'Number of times the article has been shared';
COMMENT ON COLUMN public.articles.featured IS 'Whether the article is featured on the platform';
COMMENT ON COLUMN public.articles.metadata IS 'Additional metadata in JSON format';

-- Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for reading published articles (everyone can read)
CREATE POLICY "Anyone can read published articles" ON public.articles
    FOR SELECT USING (status = 'published');

-- Policy for authors to manage their own articles
CREATE POLICY "Authors can manage their own articles" ON public.articles
    FOR ALL USING (auth.uid() = author_id);

-- Policy for authenticated users to create articles
CREATE POLICY "Authenticated users can create articles" ON public.articles
    FOR INSERT WITH CHECK (auth.uid() = author_id);

COMMIT;
-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_updated_at_articles()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at_articles
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_articles();

-- Migration: Add agent_instance_id column to articles table
-- This migration adds the missing agent_instance_id column that is required by ArticleCreationTool

BEGIN;

-- Add agent_instance_id column to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS agent_instance_id VARCHAR(255);

-- Create index for agent_instance_id queries
CREATE INDEX IF NOT EXISTS idx_articles_agent_instance_id 
ON public.articles(agent_instance_id) WHERE agent_instance_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.agent_instance_id IS 'Identifier for the specific agent instance that created this article';

COMMIT;
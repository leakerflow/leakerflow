-- Migration: Add image fields to articles table
-- This migration adds support for image attachments in articles

BEGIN;

-- Add image fields to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_alt TEXT,
ADD COLUMN IF NOT EXISTS image_caption TEXT;

-- Add comments for the new fields
COMMENT ON COLUMN public.articles.image_url IS 'URL of the main image attached to the article';
COMMENT ON COLUMN public.articles.image_alt IS 'Alt text for the main image for accessibility';
COMMENT ON COLUMN public.articles.image_caption IS 'Caption for the main image';

-- Create index for image_url for better performance when filtering articles with images
CREATE INDEX IF NOT EXISTS idx_articles_image_url ON public.articles(image_url) WHERE image_url IS NOT NULL;

COMMIT;
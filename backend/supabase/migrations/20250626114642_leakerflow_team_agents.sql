-- Migration: Add is_kortix_team field to agent_templates
-- This migration originally added support for marking templates as team templates
-- Legacy column name: is_kortix_team (renamed later to is_leakerflow_team)

BEGIN;

-- Add is_kortix_team column to agent_templates table
ALTER TABLE agent_templates ADD COLUMN IF NOT EXISTS is_kortix_team BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_agent_templates_is_kortix_team ON agent_templates(is_kortix_team);

-- Add comment
COMMENT ON COLUMN agent_templates.is_kortix_team IS 'Indicates if this template is created by the Leaker Flow team (official templates)';

COMMIT;
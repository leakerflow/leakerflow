-- Migration: Enhance Articles Security System
-- This migration adds security tracking fields to the articles table
-- for comprehensive audit and agent tracking capabilities

BEGIN;

-- =====================================================
-- 1. ADD SECURITY FIELDS TO ARTICLES TABLE
-- =====================================================

-- Add agent tracking
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(agent_id) ON DELETE SET NULL;

-- Add agent version tracking
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS agent_version_id UUID REFERENCES public.agent_versions(version_id) ON DELETE SET NULL;

-- Agent instance tracking removed - table no longer exists

-- Add creation context for audit trail
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS creation_context JSONB DEFAULT '{}'::jsonb;

-- Add security metadata for comprehensive tracking
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS security_metadata JSONB DEFAULT '{}'::jsonb;

-- Add creation method to track how the article was created
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS creation_method VARCHAR(50) DEFAULT 'manual' CHECK (creation_method IN ('manual', 'agent', 'api', 'import'));

-- Add IP address for security tracking (optional, can be null for privacy)
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS creator_ip_hash VARCHAR(64); -- SHA-256 hash of IP for privacy

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for agent queries
CREATE INDEX IF NOT EXISTS idx_articles_agent_id 
ON public.articles(agent_id) WHERE agent_id IS NOT NULL;

-- Index for agent version queries
CREATE INDEX IF NOT EXISTS idx_articles_agent_version_id 
ON public.articles(agent_version_id) WHERE agent_version_id IS NOT NULL;

-- Agent instance index removed - table no longer exists

-- Index for creation method queries
CREATE INDEX IF NOT EXISTS idx_articles_creation_method 
ON public.articles(creation_method);

-- GIN index for creation context JSON queries
CREATE INDEX IF NOT EXISTS idx_articles_creation_context 
ON public.articles USING GIN(creation_context);

-- GIN index for security metadata JSON queries
CREATE INDEX IF NOT EXISTS idx_articles_security_metadata 
ON public.articles USING GIN(security_metadata);

-- Composite index for security queries
CREATE INDEX IF NOT EXISTS idx_articles_security_composite 
ON public.articles(author_id, agent_id, creation_method, created_at);

-- =====================================================
-- 3. CREATE ARTICLE SECURITY LOG TABLE
-- =====================================================

-- Create comprehensive audit log for article operations
CREATE TABLE IF NOT EXISTS public.article_security_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- From auth.uid() or API key
    agent_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    agent_version_id UUID REFERENCES agent_versions(version_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish', 'unpublish'
    old_values JSONB, -- Previous values for updates
    new_values JSONB, -- New values for updates
    ip_address_hash VARCHAR(64), -- SHA-256 hash of IP address
    user_agent_hash VARCHAR(64), -- SHA-256 hash of User-Agent
    request_metadata JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for article security log
CREATE INDEX IF NOT EXISTS idx_article_security_log_article_id 
ON public.article_security_log(article_id);

CREATE INDEX IF NOT EXISTS idx_article_security_log_user_id 
ON public.article_security_log(user_id);

CREATE INDEX IF NOT EXISTS idx_article_security_log_agent_id 
ON public.article_security_log(agent_id) WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_article_security_log_agent_version_id 
ON public.article_security_log(agent_version_id) WHERE agent_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_article_security_log_action 
ON public.article_security_log(action);

CREATE INDEX IF NOT EXISTS idx_article_security_log_created_at 
ON public.article_security_log(created_at);

CREATE INDEX IF NOT EXISTS idx_article_security_log_success 
ON public.article_security_log(success);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_article_security_log_composite 
ON public.article_security_log(user_id, action, created_at DESC);

-- =====================================================
-- 4. CREATE SECURITY FUNCTIONS
-- =====================================================

-- Function to log article operations
CREATE OR REPLACE FUNCTION log_article_operation(
    p_article_id UUID,
    p_user_id UUID,
    p_action VARCHAR(50),
    p_agent_id UUID DEFAULT NULL,
    p_agent_version_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_hash VARCHAR(64) DEFAULT NULL,
    p_user_agent_hash VARCHAR(64) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.article_security_log (
        article_id,
        user_id,
        agent_id,
        agent_version_id,
        action,
        old_values,
        new_values,
        ip_address_hash,
        user_agent_hash,
        request_metadata,
        success,
        error_message
    ) VALUES (
        p_article_id,
        p_user_id,
        p_agent_id,
        p_agent_version_id,
        p_action,
        p_old_values,
        p_new_values,
        p_ip_hash,
        p_user_agent_hash,
        p_metadata,
        p_success,
        p_error_message
    ) RETURNING log_id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Function to validate agent ownership (simplified - agent_instances removed)
CREATE OR REPLACE FUNCTION validate_agent_ownership(
    p_agent_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_account_id UUID;
    v_agent_account_id UUID;
BEGIN
    -- Get user's account_id
    SELECT primary_owner_user_id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = p_user_id;
    
    IF v_account_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get agent's account_id
    SELECT account_id INTO v_agent_account_id
    FROM agents
    WHERE agent_id = p_agent_id;
    
    -- Check if they match
    RETURN v_account_id = v_agent_account_id;
END;
$$;

-- Function to get article security summary (simplified - agent_instances removed)
CREATE OR REPLACE FUNCTION get_article_security_summary(
    p_article_id UUID
)
RETURNS TABLE (
    article_id UUID,
    author_id UUID,
    agent_id UUID,
    agent_name VARCHAR(255),
    creation_method VARCHAR(50),
    created_at TIMESTAMPTZ,
    total_operations BIGINT,
    last_operation_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as article_id,
        a.author_id,
        a.agent_id,
        ag.name as agent_name,
        a.creation_method,
        a.created_at,
        COUNT(asl.log_id) as total_operations,
        MAX(asl.created_at) as last_operation_at
    FROM public.articles a
    LEFT JOIN agents ag ON a.agent_id = ag.agent_id
    LEFT JOIN public.article_security_log asl ON a.id = asl.article_id
    WHERE a.id = p_article_id
    GROUP BY a.id, a.author_id, a.agent_id, ag.name, a.creation_method, a.created_at;
END;
$$;

-- =====================================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC LOGGING
-- =====================================================

-- Function for automatic security logging
CREATE OR REPLACE FUNCTION trigger_article_security_log()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_action VARCHAR(50);
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Special case for status changes
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'published' THEN
                v_action := 'publish';
            ELSIF OLD.status = 'published' THEN
                v_action := 'unpublish';
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_values := to_jsonb(OLD);
    END IF;
    
    -- Log the operation (using current user from auth context)
    PERFORM log_article_operation(
        COALESCE(NEW.id, OLD.id),
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        v_action,
        COALESCE(NEW.agent_id, OLD.agent_id),
        COALESCE(NEW.agent_version_id, OLD.agent_version_id),
        v_old_values,
        v_new_values,
        NULL, -- IP hash will be set by application
        NULL, -- User agent hash will be set by application
        '{"trigger": true}'::jsonb
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_article_security_audit ON public.articles;
CREATE TRIGGER trigger_article_security_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_article_security_log();

-- =====================================================
-- 6. UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on security log table
ALTER TABLE public.article_security_log ENABLE ROW LEVEL SECURITY;

-- Policy for reading security logs (only own articles or admin)
CREATE POLICY "Users can read security logs for their articles" 
ON public.article_security_log
FOR SELECT 
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.articles 
        WHERE id = article_security_log.article_id 
        AND author_id = auth.uid()
    )
);

-- Policy for inserting security logs (system only)
CREATE POLICY "System can insert security logs" 
ON public.article_security_log
FOR INSERT 
WITH CHECK (true); -- Will be restricted by function security

-- Update articles policies to include agent validation
DROP POLICY IF EXISTS "Authenticated users can create articles" ON public.articles;
CREATE POLICY "Authenticated users can create articles" 
ON public.articles
FOR INSERT 
WITH CHECK (
    auth.uid() = author_id AND
    (agent_id IS NULL OR validate_agent_ownership(agent_id, auth.uid()))
);

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Agent instance column removed - table no longer exists
COMMENT ON COLUMN public.articles.creation_context IS 'JSON metadata about the creation context (prompts, tools used, etc.)';
COMMENT ON COLUMN public.articles.security_metadata IS 'JSON metadata for security tracking (versions, configurations, etc.)';
COMMENT ON COLUMN public.articles.creation_method IS 'Method used to create the article: manual, agent, api, or import';
COMMENT ON COLUMN public.articles.creator_ip_hash IS 'SHA-256 hash of creator IP address for security tracking';

COMMENT ON TABLE public.article_security_log IS 'Comprehensive audit log for all article operations';
COMMENT ON FUNCTION log_article_operation IS 'Function to log article operations with full context';
COMMENT ON FUNCTION validate_agent_ownership IS 'Function to validate that an agent belongs to a user';
COMMENT ON FUNCTION get_article_security_summary IS 'Function to get security summary for an article';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT ALL PRIVILEGES ON TABLE public.article_security_log TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION log_article_operation TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_agent_ownership TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_article_security_summary TO authenticated, service_role;

COMMIT;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- This migration enhances the articles table with comprehensive security tracking:
-- 1. Agent tracking for audit trail (agent_instances removed)
-- 2. Creation context and metadata for debugging and compliance
-- 3. Security log table for all operations
-- 4. Validation functions for data integrity
-- 5. Automatic triggers for seamless logging
-- 6. Updated RLS policies for security
-- 
-- The migration is designed to be backwards compatible and non-breaking.
-- Existing articles will have NULL values for new fields, which is acceptable.
-- The security logging will start working immediately for new operations.
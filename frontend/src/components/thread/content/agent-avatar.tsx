'use client';

import React from 'react';
import { useAgent } from '@/hooks/react-query/agents/use-agents';
import { LeakerFlowLogo } from '@/components/sidebar/leakerflow-logo';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentAvatarProps {
  agentId?: string;
  size?: number;
  className?: string;
  fallbackName?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  agentId, 
  size = 16, 
  className = "", 
  fallbackName = "Leaker Flow" 
}) => {
  const { data: agent, isLoading } = useAgent(agentId || '');

  if (isLoading && agentId) {
    return (
      <div 
        className={`bg-muted animate-pulse rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (!agent && !agentId) {
    return <LeakerFlowLogo size={size} />;
  }

  const isLeakerflowAgent = (agent?.metadata?.is_leakerflow_default ?? false);
  if (isLeakerflowAgent) {
    return <LeakerFlowLogo size={size} />;
  }

  if (agent?.profile_image_url) {
    return (
      <img 
        src={agent.profile_image_url} 
        alt={agent.name || fallbackName}
        className={`rounded object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (agent?.avatar) {
    return (
      <div 
        className={`flex items-center justify-center text-xs ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.75 }}
      >
        {agent.avatar}
      </div>
    );
  }

  return <LeakerFlowLogo size={size} />;
};

interface AgentNameProps {
  agentId?: string;
  fallback?: string;
}

export const AgentName: React.FC<AgentNameProps> = ({ 
  agentId, 
  fallback = "Leaker Flow" 
}) => {
  const { data: agent, isLoading } = useAgent(agentId || '');

  if (isLoading && agentId) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return <span>{agent?.name || fallback}</span>;
};
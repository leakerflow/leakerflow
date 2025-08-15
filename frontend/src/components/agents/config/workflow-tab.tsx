'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAgentWorkflows, useCreateAgentWorkflow, useDeleteAgentWorkflow } from '@/hooks/react-query/agents/use-agent-workflows';

interface WorkflowTabProps {
  agentId: string;
  isViewingOldVersion: boolean;
}

export function WorkflowTab({ agentId, isViewingOldVersion }: WorkflowTabProps) {
  const router = useRouter();
  const { data: workflows, isLoading } = useAgentWorkflows(agentId);
  const createWorkflowMutation = useCreateAgentWorkflow();
  const deleteWorkflowMutation = useDeleteAgentWorkflow();

  const handleCreateWorkflow = async () => {
    try {
      const newWorkflow = await createWorkflowMutation.mutateAsync({
        agentId,
        workflow: {
          name: 'New Workflow',
          description: 'A new workflow for this agent',
          steps: []
        }
      });
      
      router.push(`/agents/config/${agentId}/workflow/${newWorkflow.id}`);
      toast.success('Workflow created successfully');
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/agents/config/${agentId}/workflow/${workflowId}`);
  };

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      return;
    }

    try {
      await deleteWorkflowMutation.mutateAsync({ agentId, workflowId });
      toast.success('Workflow deleted successfully');
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (workflow: any) => {
    try {
      const duplicatedWorkflow = await createWorkflowMutation.mutateAsync({
        agentId,
        workflow: {
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          steps: workflow.steps || []
        }
      });
      
      toast.success('Workflow duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!isViewingOldVersion && (
          <Button onClick={handleCreateWorkflow} disabled={createWorkflowMutation.isPending} className="ml-auto h-8 text-xs rounded-xl">
            <Plus className="h-3 w-3 mr-1" />
            Create Workflow
          </Button>
        )}
      </div>

      {!workflows || workflows.length === 0 ? (
        <Card className="rounded-2xl border border-border">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-xl flex items-center justify-center">
                <Play className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">No workflows yet</h3>
                <p className="text-xs text-muted-foreground">
                  Create your first workflow to automate tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow: any) => (
            <Card key={workflow.id} className="rounded-2xl border border-border hover:border-primary/20 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">{workflow.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {workflow.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {workflow.steps?.length || 0} steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditWorkflow(workflow.id)}
                    className="flex-1 h-8 text-xs rounded-xl"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {!isViewingOldVersion && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateWorkflow(workflow)}
                        disabled={createWorkflowMutation.isPending}
                        className="h-8 w-8 p-0 rounded-xl"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                        disabled={deleteWorkflowMutation.isPending}
                        className="h-8 w-8 p-0 rounded-xl text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
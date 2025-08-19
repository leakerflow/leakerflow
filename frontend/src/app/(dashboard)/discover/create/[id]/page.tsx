'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArticleEditor } from '@/components/discover/article-creation/article-editor';
import { useArticleDetail } from '@/hooks/react-query/articles/use-article-creation';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { ArticleFormData } from '@/types/articles';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  
  const { data: article, isLoading, error } = useArticleDetail(articleId);
  
  const handleSave = (updatedArticle: any) => {
    console.log('Article updated:', updatedArticle);
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const handleGoBack = () => {
    router.push('/discover/manage');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-48 h-8 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-20 h-10 bg-muted rounded animate-pulse"></div>
                <div className="w-20 h-10 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-full h-96 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Articles
              </Button>
            </div>
            
            {/* Error State */}
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Article Not Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  The article you're looking for doesn't exist or you don't have permission to edit it.
                </p>
                <div className="flex justify-center space-x-2">
                  <Button variant="outline" onClick={handleGoBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Articles
                  </Button>
                  <Button onClick={() => router.push('/discover/create')}>
                    Create New Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Article not found or still loading...
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  // Convert article data to form data format
  const initialData: Partial<ArticleFormData> = {
    title: article.title,
    subtitle: article.description || '',
    content: article.content,
    category: article.category,
    tags: article.tags || [],
    is_published: article.is_published
  };
  
  return (
    <div className="min-h-screen bg-background">
      <ArticleEditor 
        articleId={articleId}
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
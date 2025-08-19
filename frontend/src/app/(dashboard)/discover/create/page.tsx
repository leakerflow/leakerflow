'use client';

import React from 'react';
import { ArticleEditor } from '@/components/discover/article-creation/article-editor';
import { useRouter } from 'next/navigation';

export default function CreateArticlePage() {
  const router = useRouter();
  
  const handleSave = (article: any) => {
    // Article saved successfully
    console.log('Article saved:', article);
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <div className="min-h-screen bg-background">
      <ArticleEditor 
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
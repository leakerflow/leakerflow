'use client';

import React from 'react';
import { ArticleList } from '@/components/discover/article-creation/article-list';

export default function ManageArticlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <ArticleList />
      </div>
    </div>
  );
}
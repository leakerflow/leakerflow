'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Send,
  Clock,
  Calendar,
  User,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  FileText,
  Globe,
  Archive,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useMyArticles,
  useDraftArticles,
  usePublishedArticles,
  useDeleteArticle,
  usePublishArticle,
  useUnpublishArticle,
  useBatchDeleteArticles
} from '@/hooks/react-query/articles/use-article-creation';
import type { ArticleListItem, ArticleStatus, ArticleCategory } from '@/types/articles';
import { formatDistanceToNow } from 'date-fns';

interface ArticleListProps {
  className?: string;
}

type SortField = 'title' | 'created_at' | 'updated_at' | 'views' | 'vote_score';
type SortOrder = 'asc' | 'desc';

const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'general',
  'technology',
  'business',
  'science',
  'health',
  'education',
  'entertainment',
  'sports',
  'politics',
  'lifestyle'
];

export function ArticleList({ className }: ArticleListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  
  // Queries
  const { data: allArticles, isLoading: isLoadingAll } = useMyArticles();
  const { data: draftArticles, isLoading: isLoadingDrafts } = useDraftArticles();
  const { data: publishedArticles, isLoading: isLoadingPublished } = usePublishedArticles();
  
  // Mutations
  const deleteArticle = useDeleteArticle();
  const publishArticle = usePublishArticle();
  const unpublishArticle = useUnpublishArticle();
  const batchDeleteArticles = useBatchDeleteArticles();
  
  // Get current articles based on active tab
  const getCurrentArticles = (): ArticleListItem[] => {
    switch (activeTab) {
      case 'drafts':
        return draftArticles?.articles || [];
      case 'published':
        return publishedArticles?.articles || [];
      default:
        return allArticles?.articles || [];
    }
  };
  
  const isLoading = isLoadingAll || isLoadingDrafts || isLoadingPublished;
  const articles = getCurrentArticles();
  
  // Filter and sort articles
  const filteredAndSortedArticles = React.useMemo(() => {
    let filtered = articles.filter(article => {
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Sort articles
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'views':
          aValue = a.total_views || 0;
          bValue = b.total_views || 0;
          break;
        case 'vote_score':
          aValue = a.vote_score || 0;
          bValue = b.vote_score || 0;
          break;
        default:
          aValue = a.updated_at;
          bValue = b.updated_at;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [articles, searchQuery, selectedCategory, sortField, sortOrder]);
  
  // Handlers
  const handleCreateNew = () => {
    router.push('/discover/create');
  };
  
  const handleEditArticle = (articleId: string) => {
    router.push(`/discover/create/${articleId}`);
  };
  
  const handleViewArticle = (articleId: string) => {
    router.push(`/discover/${articleId}`);
  };
  
  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticle.mutateAsync(articleId);
      setShowDeleteDialog(false);
      setArticleToDelete(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };
  
  const handlePublishArticle = async (articleId: string) => {
    try {
      await publishArticle.mutateAsync(articleId);
    } catch (error) {
      console.error('Failed to publish article:', error);
    }
  };
  
  const handleUnpublishArticle = async (articleId: string) => {
    try {
      await unpublishArticle.mutateAsync(articleId);
    } catch (error) {
      console.error('Failed to unpublish article:', error);
    }
  };
  
  const handleBatchDelete = async () => {
    try {
      await batchDeleteArticles.mutateAsync(selectedArticles);
      setSelectedArticles([]);
      setShowBatchDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete articles:', error);
    }
  };
  
  const handleSelectArticle = (articleId: string, selected: boolean) => {
    if (selected) {
      setSelectedArticles(prev => [...prev, articleId]);
    } else {
      setSelectedArticles(prev => prev.filter(id => id !== articleId));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedArticles(filteredAndSortedArticles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{String(status)}</Badge>;
    }
  };
  
  const renderArticleCard = (article: ArticleListItem) => (
    <Card key={article.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={selectedArticles.includes(article.id)}
              onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
              className="mt-1"
            />
            
            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(article.status)}
                <Badge variant="outline" className="text-xs">
                  {article.category}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                {article.title}
              </h3>
              
              {article.description && (
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                  {article.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {article.read_time} min
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {article.total_views || 0} views
                </span>
              </div>
              
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewArticle(article.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditArticle(article.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {article.status === 'draft' ? (
                <DropdownMenuItem onClick={() => handlePublishArticle(article.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleUnpublishArticle(article.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setArticleToDelete(article.id);
                  setShowDeleteDialog(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Articles</h1>
        </div>
        
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </Button>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ArticleCategory | 'all')}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              {ARTICLE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4 ml-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleSort('updated_at')}>
                  Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('created_at')}>
                  Date Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('title')}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('views')}>
                  Views
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('vote_score')}>
                  Vote Score
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      {/* Batch Actions */}
      {selectedArticles.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {selectedArticles.length} article(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedArticles([])}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBatchDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Articles</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No articles found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first article to get started'
                  }
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === filteredAndSortedArticles.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label className="text-sm text-muted-foreground">
                  Select all ({filteredAndSortedArticles.length} articles)
                </label>
              </div>
              
              {/* Articles */}
              {filteredAndSortedArticles.map(renderArticleCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="drafts" className="mt-6">
          {isLoadingDrafts ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No draft articles
                </h3>
                <p className="text-muted-foreground mb-4">
                  Draft articles will appear here as you work on them
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedArticles.map(renderArticleCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="published" className="mt-6">
          {isLoadingPublished ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No published articles
                </h3>
                <p className="text-muted-foreground mb-4">
                  Published articles will appear here for others to discover
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedArticles.map(renderArticleCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => articleToDelete && handleDeleteArticle(articleToDelete)}
              disabled={deleteArticle.isPending}
            >
              {deleteArticle.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Articles</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Are you sure you want to delete {selectedArticles.length} article(s)? This action cannot be undone.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              disabled={batchDeleteArticles.isPending}
            >
              {batchDeleteArticles.isPending ? 'Deleting...' : `Delete ${selectedArticles.length} Articles`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleList;
export type { ArticleListProps };
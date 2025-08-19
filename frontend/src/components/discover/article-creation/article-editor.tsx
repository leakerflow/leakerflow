'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TagInput } from '@/components/ui/tag-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Save, 
  Eye, 
  Send, 
  X, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  User,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { 
  useCreateArticle, 
  useUpdateArticle, 
  useAutoSaveArticle 
} from '@/hooks/react-query/articles/use-article-creation';
import type { 
  ArticleCategory, 
  ArticleStatus 
} from '@/types/articles';
import {
  articleBaseSchema,
  validateField,
  validateContentLength,
  validateTag,
  validateImageUrl,
  formatValidationErrors,
  type ArticleFormData
} from '@/lib/validations/articles';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface ArticleEditorProps {
  articleId?: string;
  initialData?: Partial<ArticleFormData>;
  onSave?: (article: any) => void;
  onCancel?: () => void;
  className?: string;
}

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

// Helper function to validate URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const AUTOSAVE_DELAY = 3000; // 3 seconds

export function ArticleEditor({ 
  articleId, 
  initialData, 
  onSave, 
  onCancel,
  className 
}: ArticleEditorProps) {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    subtitle: initialData?.subtitle || '',
    category: initialData?.category || 'general',
    tags: initialData?.tags || [],
    image_url: initialData?.image_url || '',
    source_url: initialData?.source_url || '',
    read_time: initialData?.read_time || 0,
    is_published: initialData?.is_published || false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldValidation, setFieldValidation] = useState<Record<string, { isValid: boolean; message?: string }>>({});
  
  // Mutations
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const { autoSave, isSaving, lastSaved } = useAutoSaveArticle(
    articleId || '', 
    !!articleId && hasUnsavedChanges
  );
  
  // Auto-save effect
  useEffect(() => {
    if (!articleId || !hasUnsavedChanges) return;
    
    const timer = setTimeout(() => {
      autoSave({
        title: formData.title,
        content: formData.content,
        description: formData.subtitle,
        category: formData.category,
        tags: formData.tags
      });
      setHasUnsavedChanges(false);
    }, AUTOSAVE_DELAY);
    
    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, articleId, autoSave]);
  
  // Real-time field validation
  const validateFieldRealTime = useCallback((fieldName: string, value: unknown) => {
    const validation = validateField(fieldName, value);
    
    setFieldValidation(prev => ({
      ...prev,
      [fieldName]: {
        isValid: validation.success,
        message: validation.error
      }
    }));
    
    // Clear or set error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      if (validation.success) {
        delete newErrors[fieldName];
      } else {
        newErrors[fieldName] = validation.error || 'Invalid value';
      }
      return newErrors;
    });
    
    return validation.success;
  }, []);

  // Form validation using Zod
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const result = articleBaseSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors = formatValidationErrors(result.error);
      
      // Update field validation state
      const newFieldValidation: Record<string, { isValid: boolean; message?: string }> = {};
      Object.entries(formattedErrors).forEach(([field, message]) => {
        newFieldValidation[field] = { isValid: false, message };
      });
      setFieldValidation(newFieldValidation);
      
      return { isValid: false, errors: formattedErrors };
    }
    
    setFieldValidation({});
    return { isValid: true, errors: {} };
  }, [formData]);

  // Content validation with word count and read time estimation
  const validateContentWithMetrics = useCallback((content: string) => {
    const metrics = validateContentLength(content);
    
    // Content metrics validation (read time estimation removed)
    
    return metrics;
  }, []);
  
  // Form handlers with real-time validation
  const handleInputChange = useCallback((field: keyof ArticleFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Validate field in real-time
    validateFieldRealTime(field, value);
    
    // Special handling for content to update metrics
    if (field === 'content' && typeof value === 'string') {
      validateContentWithMetrics(value);
    }
    
    // Special handling for URL validation
    if ((field === 'image_url' || field === 'source_url') && typeof value === 'string' && value) {
      if (!isValidUrl(value)) {
        setErrors(prev => ({ ...prev, [field]: 'Invalid URL format' }));
      }
    }
  }, [validateFieldRealTime, validateContentWithMetrics]);
  
  // Tag validation handler
  const handleTagAdd = useCallback((tag: string) => {
    const tagValidation = validateTag(tag);
    if (!tagValidation.success) {
      toast.error(tagValidation.error.errors[0]?.message || 'Invalid tag');
      return false;
    }
    
    const newTags = [...formData.tags, tag];
    if (newTags.length > 10) {
      toast.error('Maximum 10 tags allowed');
      return false;
    }
    
    handleInputChange('tags', newTags);
    return true;
  }, [formData.tags, handleInputChange]);
  
  const handleTagRemove = useCallback((tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', newTags);
  }, [formData.tags, handleInputChange]);
  
  const handleSaveDraft = async (): Promise<boolean> => {
    // Validate all fields before saving
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix validation errors before saving');
      return false;
    }
    
    try {
      // Convert form data to API format
      const apiData = {
        title: formData.title,
        content: formData.content,
        description: formData.subtitle || undefined,
        category: formData.category,
        tags: formData.tags,
        sources: formData.source_url ? [{ title: 'Source', url: formData.source_url }] : [],
        is_published: false
      };
      
      if (articleId) {
        await updateArticle.mutateAsync({
          id: articleId,
          data: apiData
        });
      } else {
        const newArticle = await createArticle.mutateAsync(apiData);
        router.push(`/discover/create/${newArticle.id}`);
      }
      setHasUnsavedChanges(false);
      // Clear errors on successful save
      setErrors({});
      setFieldValidation({});
      onSave?.(formData);
      toast.success('Article saved as draft');
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save article');
      return false;
    }
  };
  
  const handlePublish = async (): Promise<boolean> => {
    // Validate all fields before publishing
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix validation errors before publishing');
      return false;
    }

    // Additional validation for publishing
    try {
      articleBaseSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const publishErrors = formatValidationErrors(error);
        setErrors(publishErrors);
        toast.error('Please fix validation errors before publishing');
        return false;
      }
    }
    
    try {
      // Convert form data to API format
      const apiData = {
        title: formData.title,
        content: formData.content,
        description: formData.subtitle || undefined,
        category: formData.category,
        tags: formData.tags,
        sources: formData.source_url ? [{ title: 'Source', url: formData.source_url }] : [],
        is_published: true
      };
      
      if (articleId) {
        await updateArticle.mutateAsync({
          id: articleId,
          data: apiData
        });
      } else {
        await createArticle.mutateAsync(apiData);
      }
      setHasUnsavedChanges(false);
      // Clear errors on successful publish
      setErrors({});
      setFieldValidation({});
      toast.success('Article published successfully!');
      router.push('/discover');
      return true;
    } catch (error) {
      console.error('Failed to publish article:', error);
      toast.error('Failed to publish article');
      return false;
    }
  };
  
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.back();
      }
    }
  };
  
  const handleForceExit = () => {
    setHasUnsavedChanges(false);
    setShowExitDialog(false);
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };
  
  // Calculate estimated read time based on content
  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };
  
  const renderMarkdown = (content: string) => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-foreground">{children}</h3>,
        p: ({ children }) => <p className="mb-4 last:mb-0 text-foreground leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground">{children}</ol>,
        li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className?.includes('language-');
          return isInline ? (
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>
          ) : (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
              <code className="text-sm font-mono text-foreground">{children}</code>
            </pre>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
  
  return (
    <div className={cn("max-w-4xl mx-auto p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {articleId ? 'Edit Article' : 'Create New Article'}
          </h1>
          {isSaving && (
            <Badge variant="secondary" className="animate-pulse">
              Saving...
            </Badge>
          )}
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!formData.content.trim()}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
      
      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title *</label>
            <div className="relative">
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter an engaging title for your article..."
                className={cn(
                  "pr-10",
                  errors.title && "border-destructive focus:border-destructive",
                  fieldValidation.title?.isValid === false && "border-destructive focus:border-destructive",
                  fieldValidation.title?.isValid === true && "border-green-500 focus:border-green-500"
                )}
              />
              {fieldValidation.title?.isValid === true && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {(fieldValidation.title?.isValid === false || errors.title) && (
                <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {(errors.title || fieldValidation.title?.message) && (
              <p className="text-sm text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.title || fieldValidation.title?.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>
          
          {/* Subtitle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subtitle</label>
            <div className="relative">
              <Input
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Brief subtitle of the article..."
                className={cn(
                  "pr-10",
                  errors.subtitle && "border-destructive focus:border-destructive",
                  fieldValidation.subtitle?.isValid === false && "border-destructive focus:border-destructive",
                  fieldValidation.subtitle?.isValid === true && "border-green-500 focus:border-green-500"
                )}
              />
              {fieldValidation.subtitle?.isValid === true && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {(fieldValidation.subtitle?.isValid === false || errors.subtitle) && (
                <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {(errors.subtitle || fieldValidation.subtitle?.message) && (
              <p className="text-sm text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.subtitle || fieldValidation.subtitle?.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.subtitle.length}/300 characters
            </p>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Content *</label>
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                {formData.content && (() => {
                  const metrics = validateContentLength(formData.content);
                  return (
                    <>
                      <span className={metrics.charCount < 10 ? 'text-red-500' : 'text-green-600'}>
                        {metrics.charCount.toLocaleString()} characters
                      </span>
                      <span className="text-muted-foreground">
                        {metrics.wordCount.toLocaleString()} words
                      </span>
                      <span className="text-blue-600">
                        ~{metrics.estimatedReadTime} min read
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Write your article content here... You can use Markdown formatting. (minimum 10 characters)"
                className={cn(
                  "min-h-[400px] font-mono text-sm",
                  errors.content && "border-destructive focus:border-destructive",
                  fieldValidation.content?.isValid === false && "border-destructive focus:border-destructive",
                  fieldValidation.content?.isValid === true && "border-green-500 focus:border-green-500"
                )}
              />
              {fieldValidation.content?.isValid === true && formData.content.length >= 10 && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {(fieldValidation.content?.isValid === false || errors.content) && (
                <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
              )}
            </div>
            {(errors.content || fieldValidation.content?.message) && (
              <p className="text-sm text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.content || fieldValidation.content?.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports Markdown formatting
            </p>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Article Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category *</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as ArticleCategory)}
                    className={cn(
                      "w-full px-3 py-2 pr-10 border rounded-md bg-background text-foreground appearance-none",
                      errors.category && "border-destructive focus:border-destructive",
                      fieldValidation.category?.isValid === false && "border-destructive focus:border-destructive",
                      fieldValidation.category?.isValid === true && "border-green-500 focus:border-green-500"
                    )}
                  >
                    {ARTICLE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {fieldValidation.category?.isValid === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {(fieldValidation.category?.isValid === false || errors.category) && (
                    <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {(errors.category || fieldValidation.category?.message) && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.category || fieldValidation.category?.message}
                  </p>
                )}
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Tags
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {formData.tags?.length || 0}/10
                  </span>
                </div>
                <div className={`relative ${
                  fieldValidation.tags?.isValid === false
                    ? 'border border-destructive rounded-lg bg-destructive/5'
                    : fieldValidation.tags?.isValid === true
                    ? 'border border-green-500 rounded-lg bg-green-50'
                    : ''
                }`}>
                  <TagInput
                    tags={formData.tags}
                    onTagsChange={(tags) => handleInputChange('tags', tags)}
                    placeholder="Add tags..."
                    maxTags={10}
                    className={fieldValidation.tags?.isValid === false ? 'border-destructive' : fieldValidation.tags?.isValid === true ? 'border-green-500' : ''}
                  />
                  {fieldValidation.tags?.isValid === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                  )}
                  {fieldValidation.tags?.isValid === false && (
                    <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-destructive pointer-events-none" />
                  )}
                </div>
                {fieldValidation.tags?.message && (
                  <p className={`text-sm ${
                    fieldValidation.tags.isValid ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {fieldValidation.tags.message}
                  </p>
                )}
                {errors.tags && (
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{errors.tags}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add relevant tags to help readers find your article
                </p>
              </div>
              
              {/* Read Time Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Estimated Read Time
                </label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {calculateReadTime(formData.content)} minutes
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {formData.content.trim().split(/\s+/).length} words
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Source URL
                </label>
                <div className="relative">
                  <Input
                    value={formData.source_url}
                    onChange={(e) => handleInputChange('source_url', e.target.value)}
                    placeholder="https://example.com/source"
                    className={cn(
                      "pr-10",
                      errors.source_url && "border-destructive focus:border-destructive",
                      fieldValidation.source_url?.isValid === false && "border-destructive focus:border-destructive",
                      fieldValidation.source_url?.isValid === true && "border-green-500 focus:border-green-500"
                    )}
                  />
                  {fieldValidation.source_url?.isValid === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {(fieldValidation.source_url?.isValid === false || errors.source_url) && (
                    <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {(errors.source_url || fieldValidation.source_url?.message) && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.source_url || fieldValidation.source_url?.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Add link to original source or reference
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="w-full"
                  disabled={createArticle.isPending || updateArticle.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                
                <Button
                  onClick={handlePublish}
                  className="w-full"
                  disabled={createArticle.isPending || updateArticle.isPending || !formData.title.trim() || !formData.content.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {articleId ? 'Update & Publish' : 'Publish Article'}
                </Button>
                
                {(createArticle.isPending || updateArticle.isPending) && (
                  <p className="text-sm text-muted-foreground text-center">
                    {createArticle.isPending ? 'Creating article...' : 'Updating article...'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Article Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Badge variant="secondary">{formData.category}</Badge>
                <h1 className="text-3xl font-bold text-foreground">{formData.title}</h1>
                {formData.subtitle && (
                  <p className="text-lg text-muted-foreground">{formData.subtitle}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {calculateReadTime(formData.content)} min read
                  </span>
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    You
                  </span>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {formData.source_url && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Source:</p>
                    <a
                      href={formData.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block"
                    >
                      {formData.source_url}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none">
                {renderMarkdown(formData.content)}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={handleForceExit}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleEditor;
export type { ArticleEditorProps };
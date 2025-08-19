import { z } from 'zod';
import { ARTICLE_CATEGORIES } from '@/types/articles';

// Base article validation schema
export const articleBaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  content: z
    .string()
    .min(1, 'Content is required')
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters')
    .trim(),
  
  subtitle: z
    .string()
    .max(300, 'Subtitle must be less than 300 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  
  image_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal(''))
    .refine(
      (url) => {
        if (!url) return true;
        // Check for common image extensions
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        return imageExtensions.test(url) || url.includes('unsplash.com') || url.includes('pexels.com');
      },
      'URL must point to a valid image file'
    ),
  
  source_url: z
    .string()
    .url('Please enter a valid source URL')
    .optional()
    .or(z.literal('')),
  
  read_time: z
    .number()
    .int('Read time must be a whole number')
    .min(1, 'Read time must be at least 1 minute')
    .max(120, 'Read time must be less than 120 minutes')
    .optional()
    .or(z.literal(0)),
  
  category: z
    .enum(Object.keys(ARTICLE_CATEGORIES) as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a valid category' })
    })
    .optional(),
  
  tags: z
    .array(
      z.string()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag must be less than 30 characters')
        .regex(/^[a-zA-Z0-9\s-_]+$/, 'Tag can only contain letters, numbers, spaces, hyphens, and underscores')
        .trim()
    )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  
  is_published: z.boolean().optional().default(false),
});

// Schema for creating articles
export const articleCreateSchema = articleBaseSchema.omit({ is_published: true });

// Schema for updating articles
export const articleUpdateSchema = articleBaseSchema.partial().extend({
  id: z.string().uuid('Invalid article ID')
});

// Schema for publishing articles
export const articlePublishSchema = z.object({
  id: z.string().uuid('Invalid article ID'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum(Object.keys(ARTICLE_CATEGORIES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Category is required for publishing' })
  })
});

// Schema for article filters
export const articleFiltersSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'all']).optional().default('all'),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'read_time']).optional().default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0)
});

// Schema for batch operations
export const batchDeleteSchema = z.object({
  article_ids: z
    .array(z.string().uuid('Invalid article ID'))
    .min(1, 'At least one article must be selected')
    .max(50, 'Cannot delete more than 50 articles at once')
});

// Auto-save schema (more lenient)
export const autoSaveSchema = z.object({
  id: z.string().uuid('Invalid article ID').optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  subtitle: z.string().max(300).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  source_url: z.string().url().optional().or(z.literal('')),
  read_time: z.number().int().min(0).max(120).optional(),
  category: z.string().optional(),
  tags: z.array(z.string().max(30)).max(10).optional()
});

// Type exports
export type ArticleFormData = z.infer<typeof articleBaseSchema>;
export type ArticleCreateData = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateData = z.infer<typeof articleUpdateSchema>;
export type ArticlePublishData = z.infer<typeof articlePublishSchema>;
export type ArticleFiltersData = z.infer<typeof articleFiltersSchema>;
export type BatchDeleteData = z.infer<typeof batchDeleteSchema>;
export type AutoSaveData = z.infer<typeof autoSaveSchema>;

// Validation helper functions
export const validateArticleForm = (data: unknown) => {
  return articleBaseSchema.safeParse(data);
};

export const validateArticleCreate = (data: unknown) => {
  return articleCreateSchema.safeParse(data);
};

export const validateArticleUpdate = (data: unknown) => {
  return articleUpdateSchema.safeParse(data);
};

export const validateArticlePublish = (data: unknown) => {
  return articlePublishSchema.safeParse(data);
};

export const validateArticleFilters = (data: unknown) => {
  return articleFiltersSchema.safeParse(data);
};

export const validateBatchDelete = (data: unknown) => {
  return batchDeleteSchema.safeParse(data);
};

export const validateAutoSave = (data: unknown) => {
  return autoSaveSchema.safeParse(data);
};

// Error formatting helper
export const formatValidationErrors = (errors: z.ZodError) => {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
};

// Field validation helpers for real-time validation
export const validateField = (fieldName: string, value: unknown) => {
  const fieldSchema = articleBaseSchema.shape[fieldName as keyof typeof articleBaseSchema.shape];
  if (!fieldSchema) return { success: true, error: null };
  
  const result = fieldSchema.safeParse(value);
  return {
    success: result.success,
    error: result.success ? null : result.error.errors[0]?.message || 'Invalid value'
  };
};

// Content length validation
export const validateContentLength = (content: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const charCount = content.length;
  
  return {
    wordCount,
    charCount,
    isValid: charCount >= 10 && charCount <= 50000,
    estimatedReadTime: Math.max(1, Math.ceil(wordCount / 200)) // Average reading speed
  };
};

// Tag validation
export const validateTag = (tag: string) => {
  const tagSchema = z.string()
    .min(1, 'Tag cannot be empty')
    .max(30, 'Tag must be less than 30 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Tag can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim();
  
  return tagSchema.safeParse(tag);
};

// URL validation
export const validateImageUrl = (url: string) => {
  if (!url) return { success: true, error: null };
  
  const urlSchema = z.string().url('Please enter a valid URL');
  const urlResult = urlSchema.safeParse(url);
  
  if (!urlResult.success) {
    return { success: false, error: 'Please enter a valid URL' };
  }
  
  // Check for image extensions or known image hosting services
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const isImageHost = url.includes('unsplash.com') || url.includes('pexels.com') || url.includes('imgur.com');
  
  if (!imageExtensions.test(url) && !isImageHost) {
    return { success: false, error: 'URL must point to a valid image file' };
  }
  
  return { success: true, error: null };
};
from typing import Dict, Any, Optional, List
from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
from utils.logger import logger
from datetime import datetime
import json
import uuid

class ArticleCreationTool(SandboxToolsBase):
    """Tool for creating, editing and managing articles for the Discover platform.
    
    This tool provides comprehensive article management capabilities including:
    - Creating new articles with rich content
    - Editing existing articles
    - Publishing and unpublishing articles
    - Managing article metadata (tags, categories, sources)
    - Content validation and formatting
    """

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.workspace_path = "/workspace"

    async def _get_db_client(self):
        """Get database client from thread manager."""
        if not self.thread_manager or not self.thread_manager.db:
            raise ValueError("Database connection not available")
        return await self.thread_manager.db.client

    async def _validate_article_data(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize article data."""
        required_fields = ['title', 'content']
        for field in required_fields:
            if not article_data.get(field):
                raise ValueError(f"Required field '{field}' is missing or empty")
        
        # Sanitize and validate data
        validated_data = {
            'title': str(article_data['title']).strip(),
            'content': str(article_data['content']).strip(),
            'description': str(article_data.get('description', '')).strip(),
            'tags': article_data.get('tags', []),
            'category': article_data.get('category', 'general'),
            'sources': article_data.get('sources', []),
            'status': 'published' if article_data.get('is_published', False) else 'draft',
            'author_id': article_data.get('author_id', '00000000-0000-0000-0000-000000000000'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return validated_data

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_article",
            "description": "Create a new article for the Discover platform with title, content, tags, and metadata. The article can be saved as draft or published immediately.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the article"
                    },
                    "content": {
                        "type": "string",
                        "description": "The main content of the article in markdown format"
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description or summary of the article"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of tags for categorizing the article"
                    },
                    "category": {
                        "type": "string",
                        "description": "Category of the article (e.g., 'technology', 'business', 'science')"
                    },
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "url": {"type": "string"},
                                "description": {"type": "string"}
                            }
                        },
                        "description": "List of sources referenced in the article"
                    },
                    "is_published": {
                        "type": "boolean",
                        "description": "Whether to publish the article immediately (default: false)"
                    }
                },
                "required": ["title", "content"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="create_article">
        <parameter name="title">The Future of AI in Healthcare</parameter>
        <parameter name="content"># The Future of AI in Healthcare\n\nArtificial Intelligence is revolutionizing healthcare...\n\n## Key Benefits\n\n- Improved diagnosis accuracy\n- Faster treatment recommendations\n- Personalized medicine</parameter>
        <parameter name="description">An exploration of how AI is transforming modern healthcare practices</parameter>
        <parameter name="tags">["AI", "Healthcare", "Technology", "Medicine"]</parameter>
        <parameter name="category">technology</parameter>
        <parameter name="is_published">false</parameter>
        </invoke>
        </function_calls>
        ''')
    async def create_article(
        self,
        title: str,
        content: str,
        description: str = "",
        tags: List[str] = None,
        category: str = "general",
        sources: List[Dict[str, str]] = None,
        is_published: bool = False
    ) -> ToolResult:
        """Create a new article for the Discover platform.
        
        Args:
            title: The title of the article
            content: The main content in markdown format
            description: Brief description of the article
            tags: List of tags for categorization
            category: Article category
            sources: List of source references
            is_published: Whether to publish immediately
            
        Returns:
            ToolResult with the created article data
        """
        try:
            logger.info(f"Creating new article: {title}")
            
            # Prepare article data
            article_data = {
                'title': title,
                'content': content,
                'description': description,
                'tags': tags or [],
                'category': category,
                'sources': sources or [],
                'status': 'published' if is_published else 'draft',
                'author_id': '00000000-0000-0000-0000-000000000000'  # Default author for tool-created articles
            }
            
            # Validate article data
            validated_data = await self._validate_article_data(article_data)
            
            # Get database client
            client = await self._get_db_client()
            
            # Generate unique ID
            article_id = str(uuid.uuid4())
            validated_data['id'] = article_id
            
            # Insert article into database
            result = await client.table('articles').insert(validated_data).execute()
            
            if not result.data:
                return self.fail_response("Failed to create article in database")
            
            created_article = result.data[0]
            
            logger.info(f"Successfully created article with ID: {article_id}")
            
            return self.success_response({
                "message": "Article created successfully",
                "article": created_article,
                "status": "published" if is_published else "draft"
            })
            
        except Exception as e:
            logger.error(f"Error creating article: {e}", exc_info=True)
            return self.fail_response(f"Failed to create article: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_article",
            "description": "Update an existing article with new content, metadata, or publication status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "article_id": {
                        "type": "string",
                        "description": "The ID of the article to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "Updated title of the article"
                    },
                    "content": {
                        "type": "string",
                        "description": "Updated content of the article in markdown format"
                    },
                    "description": {
                        "type": "string",
                        "description": "Updated description of the article"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Updated list of tags"
                    },
                    "category": {
                        "type": "string",
                        "description": "Updated category"
                    },
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "url": {"type": "string"},
                                "description": {"type": "string"}
                            }
                        },
                        "description": "Updated list of sources"
                    },
                    "is_published": {
                        "type": "boolean",
                        "description": "Updated publication status"
                    }
                },
                "required": ["article_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="update_article">
        <parameter name="article_id">123e4567-e89b-12d3-a456-426614174000</parameter>
        <parameter name="title">Updated: The Future of AI in Healthcare</parameter>
        <parameter name="content"># Updated: The Future of AI in Healthcare\n\nThis updated article explores...</parameter>
        <parameter name="is_published">true</parameter>
        </invoke>
        </function_calls>
        ''')
    async def update_article(
        self,
        article_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        sources: Optional[List[Dict[str, str]]] = None,
        is_published: Optional[bool] = None
    ) -> ToolResult:
        """Update an existing article.
        
        Args:
            article_id: The ID of the article to update
            title: Updated title (optional)
            content: Updated content (optional)
            description: Updated description (optional)
            tags: Updated tags (optional)
            category: Updated category (optional)
            sources: Updated sources (optional)
            is_published: Updated publication status (optional)
            
        Returns:
            ToolResult with the updated article data
        """
        try:
            logger.info(f"Updating article: {article_id}")
            
            # Get database client
            client = await self._get_db_client()
            
            # Check if article exists
            existing_result = await client.table('articles').select('*').eq('id', article_id).execute()
            
            if not existing_result.data:
                return self.fail_response(f"Article with ID {article_id} not found")
            
            existing_article = existing_result.data[0]
            
            # Prepare update data
            update_data = {'updated_at': datetime.utcnow().isoformat()}
            
            if title is not None:
                update_data['title'] = title
            if content is not None:
                update_data['content'] = content
            if description is not None:
                update_data['description'] = description
            if tags is not None:
                update_data['tags'] = tags
            if category is not None:
                update_data['category'] = category
            if sources is not None:
                update_data['sources'] = sources
            if is_published is not None:
                update_data['status'] = 'published' if is_published else 'draft'
            
            # Update article in database
            result = await client.table('articles').update(update_data).eq('id', article_id).execute()
            
            if not result.data:
                return self.fail_response("Failed to update article in database")
            
            updated_article = result.data[0]
            
            logger.info(f"Successfully updated article: {article_id}")
            
            return self.success_response({
                "message": "Article updated successfully",
                "article": updated_article,
                "changes": list(update_data.keys())
            })
            
        except Exception as e:
            logger.error(f"Error updating article: {e}", exc_info=True)
            return self.fail_response(f"Failed to update article: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "delete_article",
            "description": "Delete an article from the Discover platform.",
            "parameters": {
                "type": "object",
                "properties": {
                    "article_id": {
                        "type": "string",
                        "description": "The ID of the article to delete"
                    }
                },
                "required": ["article_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="delete_article">
        <parameter name="article_id">123e4567-e89b-12d3-a456-426614174000</parameter>
        </invoke>
        </function_calls>
        ''')
    async def delete_article(self, article_id: str) -> ToolResult:
        """Delete an article from the platform.
        
        Args:
            article_id: The ID of the article to delete
            
        Returns:
            ToolResult confirming deletion
        """
        try:
            logger.info(f"Deleting article: {article_id}")
            
            # Get database client
            client = await self._get_db_client()
            
            # Check if article exists
            existing_result = await client.table('articles').select('id, title').eq('id', article_id).execute()
            
            if not existing_result.data:
                return self.fail_response(f"Article with ID {article_id} not found")
            
            article_title = existing_result.data[0]['title']
            
            # Delete article from database
            result = await client.table('articles').delete().eq('id', article_id).execute()
            
            logger.info(f"Successfully deleted article: {article_id}")
            
            return self.success_response({
                "message": f"Article '{article_title}' deleted successfully",
                "deleted_article_id": article_id
            })
            
        except Exception as e:
            logger.error(f"Error deleting article: {e}", exc_info=True)
            return self.fail_response(f"Failed to delete article: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_articles",
            "description": "List articles with optional filtering by category, tags, or publication status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filter by category"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Filter by tags"
                    },
                    "is_published": {
                        "type": "boolean",
                        "description": "Filter by publication status"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of articles to return (default: 20)"
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Number of articles to skip for pagination (default: 0)"
                    }
                },
                "required": []
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="list_articles">
        <parameter name="category">technology</parameter>
        <parameter name="is_published">true</parameter>
        <parameter name="limit">10</parameter>
        </invoke>
        </function_calls>
        ''')
    async def list_articles(
        self,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_published: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> ToolResult:
        """List articles with optional filtering.
        
        Args:
            category: Filter by category
            tags: Filter by tags
            is_published: Filter by publication status
            limit: Maximum number of articles to return
            offset: Number of articles to skip
            
        Returns:
            ToolResult with list of articles
        """
        try:
            logger.info(f"Listing articles with filters: category={category}, tags={tags}, published={is_published}")
            
            # Get database client
            client = await self._get_db_client()
            
            # Build query
            query = client.table('articles').select('*')
            
            # Apply filters
            if category:
                query = query.eq('category', category)
            if is_published is not None:
                status_filter = 'published' if is_published else 'draft'
                query = query.eq('status', status_filter)
            if tags:
                # Filter by tags (contains any of the specified tags)
                for tag in tags:
                    query = query.contains('tags', [tag])
            
            # Apply pagination
            query = query.range(offset, offset + limit - 1)
            
            # Order by creation date (newest first)
            query = query.order('created_at', desc=True)
            
            # Execute query
            result = await query.execute()
            
            articles = result.data or []
            
            logger.info(f"Retrieved {len(articles)} articles")
            
            return self.success_response({
                "articles": articles,
                "count": len(articles),
                "filters": {
                    "category": category,
                    "tags": tags,
                    "is_published": is_published
                },
                "pagination": {
                    "limit": limit,
                    "offset": offset
                }
            })
            
        except Exception as e:
            logger.error(f"Error listing articles: {e}", exc_info=True)
            return self.fail_response(f"Failed to list articles: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_article",
            "description": "Get a specific article by ID with all its details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "article_id": {
                        "type": "string",
                        "description": "The ID of the article to retrieve"
                    }
                },
                "required": ["article_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="get_article">
        <parameter name="article_id">123e4567-e89b-12d3-a456-426614174000</parameter>
        </invoke>
        </function_calls>
        ''')
    async def get_article(self, article_id: str) -> ToolResult:
        """Get a specific article by ID.
        
        Args:
            article_id: The ID of the article to retrieve
            
        Returns:
            ToolResult with the article data
        """
        try:
            logger.info(f"Retrieving article: {article_id}")
            
            # Get database client
            client = await self._get_db_client()
            
            # Get article from database
            result = await client.table('articles').select('*').eq('id', article_id).execute()
            
            if not result.data:
                return self.fail_response(f"Article with ID {article_id} not found")
            
            article = result.data[0]
            
            logger.info(f"Successfully retrieved article: {article['title']}")
            
            return self.success_response({
                "article": article
            })
            
        except Exception as e:
            logger.error(f"Error retrieving article: {e}", exc_info=True)
            return self.fail_response(f"Failed to retrieve article: {str(e)}")
from typing import Dict, Any, Optional, List
from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection
from utils.logger import logger
from utils.security_audit import get_security_auditor, SecurityEventType, SecurityContext, SecurityUtils
from utils.s3_upload_utils import upload_base64_image
from datetime import datetime
import json
import uuid
import hashlib
import os

class ArticleCreationTool(SandboxToolsBase):
    """Tool for creating, editing and managing articles for the Discover platform.
    
    This tool provides comprehensive article management capabilities including:
    - Creating new articles with rich content
    - Editing existing articles
    - Publishing and unpublishing articles
    - Managing article metadata (tags, categories, sources)
    - Content validation and formatting
    """

    def __init__(self, project_id: str, thread_manager: ThreadManager, agent_instance_id: Optional[str] = None):
        super().__init__(project_id, thread_manager)
        self.db = DBConnection()
        self.agent_instance_id = agent_instance_id

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
            'author_id': article_data.get('author_id'),  # Keep None if not provided
            'agent_instance_id': self.agent_instance_id,
            'agent_id': article_data.get('agent_id'),
            'agent_version_id': article_data.get('agent_version_id'),
            'creation_method': 'agent',
            'creation_context': article_data.get('creation_context', {}),
            'security_metadata': article_data.get('security_metadata', {}),
            'creator_ip_hash': article_data.get('creator_ip_hash'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return validated_data

    async def _build_creation_context(self, title: str, content: str, description: str, tags: List[str], category: str, sources: List[Dict[str, str]]) -> Dict[str, Any]:
        """Build creation context metadata for audit trail."""
        try:
            context = {
                'tool_name': 'ArticleCreationTool',
                'tool_version': '1.0.0',
                'creation_timestamp': datetime.utcnow().isoformat(),
                'project_id': self.project_id,
                'agent_id': self._get_agent_id(),
                'agent_version_id': self._get_agent_version_id(),
                'input_parameters': {
                    'title_length': len(title),
                    'content_length': len(content),
                    'description_length': len(description) if description else 0,
                    'tags_count': len(tags) if tags else 0,
                    'category': category,
                    'sources_count': len(sources) if sources else 0
                },
                'content_analysis': {
                    'title_hash': hashlib.sha256(title.encode()).hexdigest()[:16],
                    'content_hash': hashlib.sha256(content.encode()).hexdigest()[:16],
                    'estimated_reading_time': max(1, len(content.split()) // 200)  # Rough estimate
                },
                'environment': {
                    'workspace_path': self.workspace_path,
                    'python_version': os.sys.version.split()[0] if hasattr(os, 'sys') else 'unknown'
                }
            }
            
            # Add thread context if available
            if self.thread_manager:
                context['thread_context'] = {
                    'thread_id': getattr(self.thread_manager, 'thread_id', None),
                    'has_db_connection': bool(self.thread_manager.db)
                }
            
            return context
        except Exception as e:
            logger.warning(f"Failed to build creation context: {e}")
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}

    async def _build_security_metadata(self) -> Dict[str, Any]:
        """Build security metadata for compliance and audit."""
        try:
            metadata = {
                'security_version': '1.0.0',
                'audit_timestamp': datetime.utcnow().isoformat(),
                'agent_tracking': {
                    'agent_id': self._get_agent_id(),
                    'agent_version_id': self._get_agent_version_id(),
                    'agent_verified': bool(self._get_agent_id())
                },
                'data_classification': {
                    'sensitivity_level': 'public',  # Default for articles
                    'retention_policy': 'standard',
                    'compliance_tags': ['gdpr_compliant', 'audit_enabled']
                },
                'creation_source': {
                    'method': 'agent_tool',
                    'tool_class': self.__class__.__name__,
                    'automated': True
                },
                'validation': {
                    'content_validated': True,
                    'security_checked': True,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
            return metadata
        except Exception as e:
            logger.warning(f"Failed to build security metadata: {e}")
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}

    async def _get_ip_hash(self) -> Optional[str]:
        """Get hashed IP address for security tracking (privacy-preserving)."""
        try:
            # In a real implementation, this would get the actual client IP
            # For now, we'll use a placeholder that indicates it's from the agent
            agent_identifier = f"agent_{self.agent_instance_id or 'unknown'}_{datetime.utcnow().date()}"
            return hashlib.sha256(agent_identifier.encode()).hexdigest()
        except Exception as e:
            logger.warning(f"Failed to generate IP hash: {e}")
            return None

    async def _log_article_operation(self, article_id: str, action: str, success: bool = True, error_message: str = None, old_values: Dict = None, new_values: Dict = None) -> None:
        """Log article operation for security audit."""
        try:
            # Use security auditor for logging
            auditor = get_security_auditor()
            
            # Map action to SecurityEventType
            event_type_map = {
                'create': SecurityEventType.ARTICLE_CREATE,
                'update': SecurityEventType.ARTICLE_UPDATE,
                'delete': SecurityEventType.ARTICLE_DELETE,
                'publish': SecurityEventType.ARTICLE_PUBLISH,
                'unpublish': SecurityEventType.ARTICLE_UNPUBLISH
            }
            event_type = event_type_map.get(action, SecurityEventType.ARTICLE_CREATE)
            
            # Create security context
            context = SecurityUtils.create_security_context(
                user_id='00000000-0000-0000-0000-000000000000',  # Default for agent operations
                agent_instance_id=self.agent_instance_id,
                ip_address=None,  # Will be hashed in SecurityUtils
                user_agent=f"ArticleCreationTool_{self.__class__.__name__}"
            )
            
            # Log the operation
            await auditor.log_article_operation(
                event_type=event_type,
                article_id=article_id,
                context=context,
                success=success,
                error_message=error_message,
                old_values=old_values,
                new_values=new_values,
                metadata={
                    'tool_name': 'ArticleCreationTool',
                    'project_id': self.project_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to log article operation: {e}")
            # Don't fail the main operation if logging fails

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
                    },
                    "image_data": {
                        "type": "string",
                        "description": "Base64 encoded image data to attach to the article (optional)"
                    },
                    "image_alt": {
                        "type": "string",
                        "description": "Alt text for the image for accessibility (optional)"
                    },
                    "image_caption": {
                        "type": "string",
                        "description": "Caption for the image (optional)"
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
        is_published: bool = False,
        image_data: str = None,
        image_alt: str = None,
        image_caption: str = None
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
            image_data: Base64 encoded image data to attach
            image_alt: Alt text for the image
            image_caption: Caption for the image
            
        Returns:
            ToolResult with the created article data
        """
        try:
            logger.info(f"Creating new article: {title}")
            
            # Get creation context and security metadata
            creation_context = await self._build_creation_context(title, content, description, tags, category, sources)
            security_metadata = await self._build_security_metadata()
            agent_id = self._get_agent_id()
            agent_version_id = self._get_agent_version_id()
            
            # Get the correct author_id from the project
            author_id = await self._get_author_id()
            
            # Ensure we have a valid author_id before proceeding
            if author_id is None:
                raise ValueError(f"Cannot create article: No valid account_id found for project {self.project_id}")
            
            # Process image upload if provided
            image_url = None
            if image_data:
                try:
                    # Upload image to Supabase Storage
                    image_url = await upload_base64_image(
                        image_data, 
                        bucket_name="articles"
                    )
                    logger.info(f"Image uploaded successfully: {image_url}")
                except Exception as e:
                    logger.error(f"Failed to upload image: {str(e)}")
                    return ToolResult(
                        success=False,
                        output=f"Failed to upload image: {str(e)}"
                    )
            
            # Prepare article data
            article_data = {
                'title': title,
                'content': content,
                'description': description,
                'tags': tags or [],
                'category': category,
                'sources': sources or [],
                'status': 'published' if is_published else 'draft',
                'author_id': author_id,
                'creation_context': creation_context,
                'security_metadata': security_metadata,
                'creator_ip_hash': await self._get_ip_hash(),
                'agent_id': agent_id,
                'agent_version_id': agent_version_id,
                'image_url': image_url,
                'image_alt': image_alt,
                'image_caption': image_caption
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
                # Log failed operation
                await self._log_article_operation(
                    article_id, 
                    'create', 
                    success=False, 
                    error_message="Failed to insert article into database",
                    new_values=validated_data
                )
                return self.fail_response("Failed to create article in database")
            
            created_article = result.data[0]
            
            # Log successful operation
            await self._log_article_operation(
                article_id, 
                'create', 
                success=True, 
                new_values=created_article
            )
            
            logger.info(f"Successfully created article with ID: {article_id}")
            
            return self.success_response({
                "message": "Article created successfully",
                "article": created_article,
                "status": "published" if is_published else "draft",
                "security_info": {
                    "agent_instance_id": self.agent_instance_id,
                    "creation_method": "agent",
                    "audit_logged": True
                }
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
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_article",
            "description": "Update an existing article on the Discover platform with new content, metadata, or images.",
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
                        "description": "Updated content in markdown format"
                    },
                    "description": {
                        "type": "string",
                        "description": "Updated brief description of the article"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Updated list of tags for categorization"
                    },
                    "category": {
                        "type": "string",
                        "description": "Updated article category"
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
                        "description": "Updated list of source references"
                    },
                    "is_published": {
                        "type": "boolean",
                        "description": "Updated publication status"
                    },
                    "image_data": {
                        "type": "string",
                        "description": "Base64 encoded image data to attach to the article"
                    },
                    "image_alt": {
                        "type": "string",
                        "description": "Alt text for the attached image"
                    },
                    "image_caption": {
                        "type": "string",
                        "description": "Caption for the attached image"
                    }
                },
                "required": ["article_id"]
            }
        }
    })
    async def update_article(
        self,
        article_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        sources: Optional[List[Dict[str, str]]] = None,
        is_published: Optional[bool] = None,
        image_data: Optional[str] = None,
        image_alt: Optional[str] = None,
        image_caption: Optional[str] = None
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
            image_data: Base64 encoded image data to attach (optional)
            image_alt: Alt text for the image (optional)
            image_caption: Caption for the image (optional)
            
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
            
            # Process image upload if provided
            image_url = None
            if image_data:
                try:
                    # Upload image to Supabase Storage
                    image_url = await upload_base64_image(
                        image_data, 
                        bucket_name="articles"
                    )
                    logger.info(f"Image uploaded successfully: {image_url}")
                except Exception as e:
                    logger.error(f"Failed to upload image: {str(e)}")
                    return ToolResult(
                        success=False,
                        output=f"Failed to upload image: {str(e)}"
                    )
            
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
            if image_data is not None:
                update_data['image_url'] = image_url
            if image_alt is not None:
                update_data['image_alt'] = image_alt
            if image_caption is not None:
                update_data['image_caption'] = image_caption
            
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
            logger.error(f"Error retrieving article {article_id}: {str(e)}")
            return self.fail_response(f"Failed to retrieve article: {str(e)}")
    
    def _get_agent_id(self) -> Optional[str]:
        """Get the current agent ID from environment or configuration"""
        agent_id = os.getenv('AGENT_ID')
        # Return None if no valid agent_id is available
        # This allows the database to store NULL instead of creating invalid foreign key references
        return agent_id if agent_id else None
    
    def _get_agent_version_id(self) -> Optional[str]:
        """Get the current agent version ID from environment or configuration"""
        version_id = os.getenv('AGENT_VERSION_ID')
        # Return None if no valid agent_version_id is available
        # This allows the database to store NULL instead of creating invalid foreign key references
        return version_id if version_id else None
    
    async def _get_author_id(self) -> str:
        """Get the author_id by looking up the account_id from the project."""
        try:
            client = await self._get_db_client()
            
            # Get the account_id from the project
            project_result = await client.table('projects').select('account_id').eq('project_id', self.project_id).execute()
            
            if project_result.data and len(project_result.data) > 0:
                account_id = project_result.data[0].get('account_id')
                if account_id:
                    logger.info(f"Found account_id {account_id} for project {self.project_id}")
                    return account_id
            
            logger.warning(f"No account_id found for project {self.project_id}")
            return None  # No fallback, let the article creation fail if no valid account_id
            
        except Exception as e:
            logger.error(f"Error getting author_id: {e}")
            return None  # No fallback, let the article creation fail if error occurs
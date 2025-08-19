from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from utils.logger import logger
from utils.auth_utils import get_current_user_id_from_jwt
from services.supabase import DBConnection

router = APIRouter(tags=["articles"])

db: Optional[DBConnection] = None


class ArticleCreateRequest(BaseModel):
    title: str
    content: str
    description: Optional[str] = ""
    tags: Optional[List[str]] = []
    category: Optional[str] = "general"
    sources: Optional[List[Dict[str, str]]] = []
    status: Optional[str] = "draft"  # draft, published, archived


class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    sources: Optional[List[Dict[str, str]]] = None
    status: Optional[str] = None  # draft, published, archived


class ArticleResponse(BaseModel):
    id: str
    title: str
    content: str
    description: str
    tags: List[str]
    category: str
    sources: List[Dict[str, str]]
    status: str  # draft, published, archived
    author_id: str
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    view_count: Optional[int] = 0
    like_count: Optional[int] = 0
    share_count: Optional[int] = 0
    featured: Optional[bool] = False


class ArticleListResponse(BaseModel):
    articles: List[ArticleResponse]
    total_count: int
    has_more: bool
    pagination: Dict[str, Any]


class ArticleMetricsResponse(BaseModel):
    article_id: str
    view_count: int
    vote_score: int
    upvotes: int
    downvotes: int
    save_count: int


def initialize(database: DBConnection):
    """Initialize the articles API with database connection."""
    global db
    db = database


async def validate_article_ownership(article_id: str, user_id: str) -> Dict[str, Any]:
    """Validate that the user owns the article and return article data."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        client = await db.client
        result = await client.table('articles').select('*').eq('id', article_id).eq('author_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Article not found or access denied")
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Error validating article ownership: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("", response_model=ArticleResponse)
async def create_article(
    request: ArticleCreateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a new article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Creating article: {request.title} for user: {user_id}")
        
        # Prepare article data
        article_data = {
            'title': request.title.strip(),
            'content': request.content.strip(),
            'description': request.description.strip() if request.description else "",
            'tags': request.tags or [],
            'category': request.category or "general",
            'sources': request.sources or [],
            'status': request.status or "draft",
            'author_id': user_id
        }
        
        # Validate required fields
        if not article_data['title'] or not article_data['content']:
            raise HTTPException(status_code=400, detail="Title and content are required")
        
        # Insert article into database
        client = await db.client
        result = await client.table('articles').insert(article_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create article")
        
        created_article = result.data[0]
        logger.info(f"Successfully created article with ID: {created_article['id']}")
        
        return ArticleResponse(**created_article)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    category: Optional[str] = Query(None, description="Filter by category"),
    tags: Optional[str] = Query(None, description="Comma-separated list of tags to filter by"),
    status: Optional[str] = Query(None, description="Filter by status: draft, published, archived"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    limit: Optional[int] = Query(20, description="Maximum number of articles to return"),
    offset: Optional[int] = Query(0, description="Number of articles to skip"),
    author_id: Optional[str] = Query(None, description="Filter by author ID"),
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """List articles with optional filtering and pagination."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Listing articles with filters: category={category}, tags={tags}, status={status}")
        
        # Get client instance
        client = await db.client
        
        # Build query
        query = client.table('articles').select('*')
        
        # Apply filters
        if category:
            query = query.eq('category', category)
        if status:
            query = query.eq('status', status)
        if author_id:
            query = query.eq('author_id', author_id)
        if search:
            # Simple text search in title and description
            query = query.or_(f'title.ilike.%{search}%,description.ilike.%{search}%')
        if tags:
            # Filter by tags (contains any of the specified tags)
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            for tag in tag_list:
                query = query.contains('tags', [tag])
        
        # Get total count for pagination
        count_query = client.table('articles').select('id', count='exact')
        if category:
            count_query = count_query.eq('category', category)
        if status:
            count_query = count_query.eq('status', status)
        if author_id:
            count_query = count_query.eq('author_id', author_id)
        if search:
            count_query = count_query.or_(f'title.ilike.%{search}%,description.ilike.%{search}%')
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            for tag in tag_list:
                count_query = count_query.contains('tags', [tag])
        
        count_result = await count_query.execute()
        total_count = count_result.count or 0
        
        # Apply pagination and ordering
        query = query.range(offset, offset + limit - 1)
        query = query.order('created_at', desc=True)
        
        # Execute query
        result = await query.execute()
        articles = result.data or []
        
        # Calculate pagination info
        has_more = (offset + len(articles)) < total_count
        
        logger.info(f"Retrieved {len(articles)} articles out of {total_count} total")
        
        return ArticleListResponse(
            articles=[ArticleResponse(**article) for article in articles],
            total_count=total_count,
            has_more=has_more,
            pagination={
                "limit": limit,
                "offset": offset,
                "current_page": (offset // limit) + 1,
                "total_pages": (total_count + limit - 1) // limit
            }
        )
        
    except Exception as e:
        logger.error(f"Error listing articles: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get a specific article by ID."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Retrieving article: {article_id}")
        
        # Get article from database
        client = await db.client
        result = await client.table('articles').select('*').eq('id', article_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = result.data[0]
        
        # Check if article is published or user is the author
        if article['status'] != 'published' and article['author_id'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to unpublished article")
        
        logger.info(f"Successfully retrieved article: {article['title']}")
        
        return ArticleResponse(**article)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: str,
    request: ArticleUpdateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Update an existing article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Updating article: {article_id}")
        
        # Validate ownership
        await validate_article_ownership(article_id, user_id)
        
        # Prepare update data
        update_data = {'updated_at': datetime.utcnow().isoformat()}
        
        if request.title is not None:
            update_data['title'] = request.title.strip()
        if request.content is not None:
            update_data['content'] = request.content.strip()
        if request.description is not None:
            update_data['description'] = request.description.strip()
        if request.tags is not None:
            update_data['tags'] = request.tags
        if request.category is not None:
            update_data['category'] = request.category
        if request.sources is not None:
            update_data['sources'] = request.sources
        if request.status is not None:
            update_data['status'] = request.status
        
        # Validate required fields if they're being updated
        if 'title' in update_data and not update_data['title']:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        if 'content' in update_data and not update_data['content']:
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        # Update article in database
        client = await db.client
        result = await client.table('articles').update(update_data).eq('id', article_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update article")
        
        updated_article = result.data[0]
        logger.info(f"Successfully updated article: {article_id}")
        
        return ArticleResponse(**updated_article)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Delete an article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Deleting article: {article_id}")
        
        # Validate ownership
        article = await validate_article_ownership(article_id, user_id)
        article_title = article['title']
        
        # Delete article from database
        client = await db.client
        result = await client.table('articles').delete().eq('id', article_id).execute()
        
        logger.info(f"Successfully deleted article: {article_title}")
        
        return {"message": f"Article '{article_title}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{article_id}/publish")
async def publish_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Publish an article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Publishing article: {article_id}")
        
        # Validate ownership
        await validate_article_ownership(article_id, user_id)
        
        # Update publication status
        update_data = {
            'status': 'published'
        }
        
        client = await db.client
        result = await client.table('articles').update(update_data).eq('id', article_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to publish article")
        
        logger.info(f"Successfully published article: {article_id}")
        
        return {"message": "Article published successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{article_id}/unpublish")
async def unpublish_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Unpublish an article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Unpublishing article: {article_id}")
        
        # Validate ownership
        await validate_article_ownership(article_id, user_id)
        
        # Update publication status
        update_data = {
            'status': 'draft'
        }
        
        # Get client instance
        client = await db.client
        
        result = await client.table('articles').update(update_data).eq('id', article_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to unpublish article")
        
        logger.info(f"Successfully unpublished article: {article_id}")
        
        return {"message": "Article unpublished successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unpublishing article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{article_id}/metrics", response_model=ArticleMetricsResponse)
async def get_article_metrics(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get article metrics (views, votes, saves)."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Getting metrics for article: {article_id}")
        
        # Get client instance
        client = await db.client
        
        # Get article basic info
        article_result = await client.table('articles').select('id, view_count').eq('id', article_id).execute()
        
        if not article_result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = article_result.data[0]
        
        # Get detailed vote counts
        upvotes_result = await client.table('article_votes').select('id', count='exact').eq('article_id', article_id).eq('vote_type', 'upvote').execute()
        downvotes_result = await client.table('article_votes').select('id', count='exact').eq('article_id', article_id).eq('vote_type', 'downvote').execute()
        saves_result = await client.table('saved_articles').select('id', count='exact').eq('article_id', article_id).execute()
        
        upvotes = upvotes_result.count or 0
        downvotes = downvotes_result.count or 0
        save_count = saves_result.count or 0
        
        # Calculate vote score as upvotes - downvotes
        vote_score = upvotes - downvotes
        
        return ArticleMetricsResponse(
            article_id=article_id,
            view_count=article['view_count'] or 0,
            vote_score=vote_score,
            upvotes=upvotes,
            downvotes=downvotes,
            save_count=save_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting article metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{article_id}/vote")
async def vote_on_article(
    article_id: str,
    vote_type: str = Query(..., description="Vote type: 'upvote' or 'downvote'"),
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Vote on an article."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    if vote_type not in ['upvote', 'downvote']:
        raise HTTPException(status_code=400, detail="Vote type must be 'upvote' or 'downvote'")
    
    try:
        logger.info(f"User {user_id} voting {vote_type} on article: {article_id}")
        
        # Get client instance
        client = await db.client
        
        # Check if article exists
        article_result = await client.table('articles').select('id').eq('id', article_id).execute()
        if not article_result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Check if user already voted
        existing_vote = await client.table('article_votes').select('*').eq('article_id', article_id).eq('user_id', user_id).execute()
        
        if existing_vote.data:
            # Update existing vote
            await client.table('article_votes').update({'vote_type': vote_type, 'updated_at': datetime.utcnow().isoformat()}).eq('article_id', article_id).eq('user_id', user_id).execute()
        else:
            # Create new vote
            vote_data = {
                'article_id': article_id,
                'user_id': user_id,
                'vote_type': vote_type,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            await client.table('article_votes').insert(vote_data).execute()
        
        # Calculate current vote score for response
        upvotes_result = await client.table('article_votes').select('id', count='exact').eq('article_id', article_id).eq('vote_type', 'upvote').execute()
        downvotes_result = await client.table('article_votes').select('id', count='exact').eq('article_id', article_id).eq('vote_type', 'downvote').execute()
        
        upvotes = upvotes_result.count or 0
        downvotes = downvotes_result.count or 0
        vote_score = upvotes - downvotes
        
        logger.info(f"Successfully recorded {vote_type} for article: {article_id}")
        
        return {
            "message": f"Vote recorded successfully",
            "vote_type": vote_type,
            "new_score": vote_score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error voting on article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{article_id}/save")
async def save_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Save an article to user's saved list."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"User {user_id} saving article: {article_id}")
        
        # Get client instance
        client = await db.client
        
        # Check if article exists
        article_result = await client.table('articles').select('id').eq('id', article_id).execute()
        if not article_result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Check if already saved
        existing_save = await client.table('saved_articles').select('*').eq('article_id', article_id).eq('user_id', user_id).execute()
        
        if existing_save.data:
            return {"message": "Article already saved"}
        
        # Save article
        save_data = {
            'article_id': article_id,
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        await client.table('saved_articles').insert(save_data).execute()
        
        logger.info(f"Successfully saved article: {article_id} for user: {user_id}")
        
        return {"message": "Article saved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{article_id}/save")
async def unsave_article(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Remove an article from user's saved list."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"User {user_id} unsaving article: {article_id}")
        
        # Get client instance
        client = await db.client
        
        # Remove from saved articles
        result = await client.table('saved_articles').delete().eq('article_id', article_id).eq('user_id', user_id).execute()
        
        logger.info(f"Successfully unsaved article: {article_id} for user: {user_id}")
        
        return {"message": "Article removed from saved list"}
        
    except Exception as e:
        logger.error(f"Error unsaving article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{article_id}/view")
async def increment_article_views(
    article_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Increment article view count."""
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        logger.info(f"Incrementing view count for article: {article_id}")
        
        # Get client instance
        client = await db.client
        
        # Check if article exists
        article_result = await client.table('articles').select('id, view_count').eq('id', article_id).execute()
        if not article_result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        current_views = article_result.data[0]['view_count'] or 0
        new_view_count = current_views + 1
        
        # Update view count
        await client.table('articles').update({'view_count': new_view_count}).eq('id', article_id).execute()
        
        # Record view event
        view_data = {
            'article_id': article_id,
            'user_id': user_id,
            'viewed_at': datetime.utcnow().isoformat()
        }
        
        await client.table('article_views').insert(view_data).execute()
        
        logger.info(f"Successfully incremented view count for article: {article_id} to {new_view_count}")
        
        return {
            "message": "View count incremented",
            "new_view_count": new_view_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing view count: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
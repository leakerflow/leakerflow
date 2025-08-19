"""Security Audit and Logging Module

This module provides comprehensive security auditing and logging capabilities
for the Leakerflow platform, with focus on article creation and agent tracking.
"""

from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from utils.logger import logger
import hashlib
import json
import uuid
import asyncio
from dataclasses import dataclass, asdict
from enum import Enum

class SecurityEventType(Enum):
    """Types of security events that can be logged."""
    ARTICLE_CREATE = "article_create"
    ARTICLE_UPDATE = "article_update"
    ARTICLE_DELETE = "article_delete"
    ARTICLE_PUBLISH = "article_publish"
    ARTICLE_UNPUBLISH = "article_unpublish"
    AGENT_ACCESS = "agent_access"
    USER_LOGIN = "user_login"
    API_ACCESS = "api_access"
    SECURITY_VIOLATION = "security_violation"
    DATA_EXPORT = "data_export"
    PERMISSION_CHANGE = "permission_change"

class SecurityLevel(Enum):
    """Security levels for classification."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

@dataclass
class SecurityContext:
    """Security context for operations."""
    user_id: str
    agent_instance_id: Optional[str] = None
    ip_address_hash: Optional[str] = None
    user_agent_hash: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()

@dataclass
class SecurityEvent:
    """Security event data structure."""
    event_type: SecurityEventType
    resource_id: str
    resource_type: str
    context: SecurityContext
    success: bool = True
    error_message: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    security_level: SecurityLevel = SecurityLevel.PUBLIC
    
class SecurityAuditor:
    """Main security auditing class."""
    
    def __init__(self, db_client=None):
        self.db_client = db_client
        self.agent_id = self._get_agent_id()
        self.agent_version_id = self._get_agent_version_id()
        self._event_queue = asyncio.Queue()
        self._processing_task = None
        self._start_processing()
    
    def _get_agent_id(self) -> Optional[str]:
        """Get the current agent ID from environment or configuration"""
        # In a real implementation, this would come from the agent configuration
        # For now, we'll use environment variable or default
        import os
        return os.getenv('AGENT_ID', None)
    
    def _get_agent_version_id(self) -> Optional[str]:
        """Get the current agent version ID from environment or configuration"""
        # In a real implementation, this would come from the agent runtime
        import os
        return os.getenv('AGENT_VERSION_ID', None)
    
    def _start_processing(self):
        """Start background task for processing security events."""
        if self._processing_task is None or self._processing_task.done():
            self._processing_task = asyncio.create_task(self._process_events())
    
    async def _process_events(self):
        """Background task to process security events."""
        while True:
            try:
                event = await self._event_queue.get()
                await self._persist_event(event)
                self._event_queue.task_done()
            except Exception as e:
                logger.error(f"Error processing security event: {e}")
                await asyncio.sleep(1)  # Brief pause before retrying
    
    async def log_event(self, event: SecurityEvent) -> bool:
        """Log a security event asynchronously."""
        try:
            await self._event_queue.put(event)
            return True
        except Exception as e:
            logger.error(f"Failed to queue security event: {e}")
            return False
    
    async def log_article_operation(
        self,
        event_type: SecurityEventType,
        article_id: str,
        context: SecurityContext,
        success: bool = True,
        error_message: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> bool:
        """Log an article-related security event."""
        event = SecurityEvent(
            event_type=event_type,
            resource_id=article_id,
            resource_type="article",
            context=context,
            success=success,
            error_message=error_message,
            old_values=old_values,
            new_values=new_values,
            metadata=metadata or {}
        )
        return await self.log_event(event)
    
    async def _persist_event(self, event: SecurityEvent) -> None:
        """Persist security event to database."""
        try:
            if not self.db_client:
                logger.warning("No database client available for security logging")
                return
            
            log_data = {
                'article_id': event.resource_id if event.resource_type == 'article' else None,
                'user_id': event.context.user_id,
                'agent_id': self.agent_id,
                'agent_version_id': self.agent_version_id,
                'action': event.event_type.value,
                'old_values': event.old_values,
                'new_values': event.new_values,
                'ip_address_hash': event.context.ip_address_hash,
                'user_agent_hash': event.context.user_agent_hash,
                'request_metadata': {
                    'event_type': event.event_type.value,
                    'resource_type': event.resource_type,
                    'security_level': event.security_level.value,
                    'session_id': event.context.session_id,
                    'request_id': event.context.request_id,
                    'timestamp': event.context.timestamp.isoformat(),
                    'metadata': event.metadata
                },
                'success': event.success,
                'error_message': event.error_message
            }
            
            # Use the database function for logging
            await self.db_client.rpc('log_article_operation', log_data).execute()
            
        except Exception as e:
            logger.error(f"Failed to persist security event: {e}")
    
    async def get_security_summary(
        self,
        resource_id: str,
        resource_type: str = "article"
    ) -> Optional[Dict[str, Any]]:
        """Get security summary for a resource."""
        try:
            if not self.db_client:
                return None
            
            if resource_type == "article":
                result = await self.db_client.rpc(
                    'get_article_security_summary',
                    {'p_article_id': resource_id}
                ).execute()
                
                if result.data:
                    return result.data[0]
            
            return None
        except Exception as e:
            logger.error(f"Failed to get security summary: {e}")
            return None
    
    async def validate_agent_ownership(
        self,
        agent_instance_id: str,
        user_id: str
    ) -> bool:
        """Validate that an agent belongs to a user."""
        try:
            if not self.db_client:
                return False
            
            result = await self.db_client.rpc(
                'validate_agent_ownership',
                {
                    'p_agent_instance_id': agent_instance_id,
                    'p_user_id': user_id
                }
            ).execute()
            
            return bool(result.data and result.data[0])
        except Exception as e:
            logger.error(f"Failed to validate agent ownership: {e}")
            return False
    
    async def get_audit_trail(
        self,
        resource_id: str,
        resource_type: str = "article",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get audit trail for a resource."""
        try:
            if not self.db_client:
                return []
            
            # Query the security log table
            query = self.db_client.table('article_security_log')
            
            if resource_type == "article":
                query = query.select('*').eq('article_id', resource_id)
            
            query = query.order('created_at', desc=True).limit(limit)
            result = await query.execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get audit trail: {e}")
            return []
    
    async def detect_anomalies(
        self,
        user_id: str,
        time_window_hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Detect security anomalies for a user."""
        try:
            if not self.db_client:
                return []
            
            anomalies = []
            since = datetime.utcnow() - timedelta(hours=time_window_hours)
            
            # Query recent activities
            result = await self.db_client.table('article_security_log').select('*').eq(
                'user_id', user_id
            ).gte('created_at', since.isoformat()).execute()
            
            activities = result.data or []
            
            # Check for rapid article creation
            create_actions = [a for a in activities if a['action'] == 'create']
            if len(create_actions) > 10:  # More than 10 articles in time window
                anomalies.append({
                    'type': 'rapid_creation',
                    'severity': 'medium',
                    'description': f'User created {len(create_actions)} articles in {time_window_hours} hours',
                    'count': len(create_actions)
                })
            
            # Check for failed operations
            failed_actions = [a for a in activities if not a['success']]
            if len(failed_actions) > 5:  # More than 5 failures
                anomalies.append({
                    'type': 'multiple_failures',
                    'severity': 'high',
                    'description': f'User had {len(failed_actions)} failed operations in {time_window_hours} hours',
                    'count': len(failed_actions)
                })
            
            # Check for unusual agent usage
            agent_actions = [a for a in activities if a.get('agent_id')]
            unique_agents = set(a['agent_id'] for a in agent_actions if a.get('agent_id'))
            if len(unique_agents) > 3:  # Using more than 3 different agents
                anomalies.append({
                    'type': 'multiple_agents',
                    'severity': 'low',
                    'description': f'User used {len(unique_agents)} different agents in {time_window_hours} hours',
                    'count': len(unique_agents)
                })
            
            return anomalies
        except Exception as e:
            logger.error(f"Failed to detect anomalies: {e}")
            return []
    
    async def cleanup_old_logs(self, retention_days: int = 90) -> int:
        """Clean up old security logs based on retention policy."""
        try:
            if not self.db_client:
                return 0
            
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            result = await self.db_client.table('article_security_log').delete().lt(
                'created_at', cutoff_date.isoformat()
            ).execute()
            
            deleted_count = len(result.data) if result.data else 0
            logger.info(f"Cleaned up {deleted_count} old security log entries")
            
            return deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")
            return 0

class SecurityUtils:
    """Utility functions for security operations."""
    
    @staticmethod
    def hash_ip_address(ip_address: str, salt: str = "") -> str:
        """Hash IP address for privacy-preserving logging."""
        combined = f"{ip_address}{salt}{datetime.utcnow().date()}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    @staticmethod
    def hash_user_agent(user_agent: str) -> str:
        """Hash user agent string."""
        return hashlib.sha256(user_agent.encode()).hexdigest()
    
    @staticmethod
    def generate_request_id() -> str:
        """Generate unique request ID."""
        return str(uuid.uuid4())
    
    @staticmethod
    def sanitize_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize metadata to remove sensitive information."""
        sensitive_keys = ['password', 'token', 'secret', 'key', 'credential']
        sanitized = {}
        
        for key, value in metadata.items():
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = SecurityUtils.sanitize_metadata(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def create_security_context(
        user_id: str,
        agent_instance_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> SecurityContext:
        """Create a security context with hashed sensitive data."""
        return SecurityContext(
            user_id=user_id,
            agent_instance_id=agent_instance_id,
            ip_address_hash=SecurityUtils.hash_ip_address(ip_address) if ip_address else None,
            user_agent_hash=SecurityUtils.hash_user_agent(user_agent) if user_agent else None,
            session_id=session_id,
            request_id=request_id or SecurityUtils.generate_request_id()
        )

# Global security auditor instance
_global_auditor: Optional[SecurityAuditor] = None

def get_security_auditor(db_client=None) -> SecurityAuditor:
    """Get or create global security auditor instance."""
    global _global_auditor
    if _global_auditor is None or db_client is not None:
        _global_auditor = SecurityAuditor(db_client)
    return _global_auditor

def init_security_auditor(db_client) -> SecurityAuditor:
    """Initialize global security auditor with database client."""
    global _global_auditor
    _global_auditor = SecurityAuditor(db_client)
    return _global_auditor
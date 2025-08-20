#!/usr/bin/env python3
"""
GTA 6 Information Validation Tool
Integrates validation and credibility classification system into the agent framework
"""

import json
from typing import Dict, Any, List, Optional
from agentpress.tool import Tool, ToolResult, openapi_schema, usage_example
from agent.gta6_validation_system import (
    GTA6ValidationSystem,
    CredibilityLevel,
    SourceType,
    GTA6Information
)
from datetime import datetime

class GTA6ValidationTool(Tool):
    """
    Tool for GTA 6 information validation and credibility classification
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validation_system = GTA6ValidationSystem()
    
    def validate_information(self, **kwargs) -> Dict[str, Any]:
        """Validate GTA 6 information - compatibility method for validation."""
        return self.validate_gta6_info(action="validate_info", **kwargs)
    
    def get_confirmed_info(self, **kwargs) -> Dict[str, Any]:
        """Get confirmed GTA 6 information - compatibility method for validation."""
        return self.validate_gta6_info(action="get_confirmed_info", **kwargs)
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "validate_gta6_info",
            "description": "Validates and classifies credibility of GTA 6 information based on sources and evidence. Critical for maintaining information accuracy and credibility standards.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "validate_info", 
                            "classify_source", 
                            "get_confirmed_info",
                            "generate_report"
                        ],
                        "description": "Action to be executed by the validation system"
                    },
                    "information": {
                        "type": "string",
                        "description": "Information to be validated (required for validate_info)"
                    },
                    "source_name": {
                        "type": "string",
                        "description": "Name of the information source"
                    },
                    "source_type": {
                        "type": "string",
                        "enum": [
                            "official_rockstar", "gaming_media", "insider_leak", 
                            "social_media", "community_forum", "data_mining",
                            "patent_filing", "job_listing", "financial_report"
                        ],
                        "description": "Type of the information source"
                    },
                    "info_type": {
                        "type": "string",
                        "enum": [
                            "release_date", "gameplay_feature", "map_location", 
                            "character_info", "vehicle_info", "technical_spec",
                            "business_info", "development_update"
                        ],
                        "description": "Type of information being validated"
                    },
                    "publication_date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date when the information was published (YYYY-MM-DD)"
                    },
                    "evidence_links": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Links to supporting evidence (optional)"
                    }
                },
                "required": ["action"]
            }
        }
    })
    @usage_example('''
        <!-- Validate specific GTA 6 information -->
        <function_calls>
        <invoke name="validate_gta6_info">
        <parameter name="action">validate_info</parameter>
        <parameter name="information">GTA 6 will be released in Fall 2025</parameter>
        <parameter name="source_name">Rockstar Games</parameter>
        <parameter name="source_type">official_rockstar</parameter>
        <parameter name="info_type">release_date</parameter>
        <parameter name="publication_date">2024-12-05</parameter>
        </invoke>
        </function_calls>
        
        <!-- Classify source credibility -->
        <function_calls>
        <invoke name="validate_gta6_info">
        <parameter name="action">classify_source</parameter>
        <parameter name="source_name">Jason Schreier</parameter>
        <parameter name="source_type">gaming_media</parameter>
        </invoke>
        </function_calls>
        
        <!-- Get confirmed information report -->
        <function_calls>
        <invoke name="validate_gta6_info">
        <parameter name="action">get_confirmed_info</parameter>
        <parameter name="info_type">release_date</parameter>
        </invoke>
        </function_calls>
        ''')
    async def validate_gta6_info(self, action: str, information: Optional[str] = None,
                                source_name: Optional[str] = None, source_type: Optional[str] = None,
                                info_type: Optional[str] = None, publication_date: Optional[str] = None,
                                evidence_links: Optional[List[str]] = None) -> ToolResult:
        """
        Executes GTA 6 information validation
        """
        try:
            action = kwargs.get("action")
            
            if action == "validate_info":
                return await self._validate_information(kwargs.get("information", {}))
            elif action == "classify_source":
                return await self._classify_source(kwargs.get("source_name", ""))
            elif action == "get_confirmed_info":
                return await self._get_confirmed_info(kwargs.get("topic_filter"))
            elif action == "generate_report":
                return await self._generate_validation_report()
            else:
                return {
                    "success": False,
                    "error": f"Unrecognized action: {action}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Validation error: {str(e)}"
            }
    
    async def _validate_information(self, info_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates specific information about GTA 6
        """
        try:
            # Convert data to GTA6Information object
            source_type = SourceType(info_data.get("source_type", "COMMUNITY"))
            
            # Parse date
            date_published = None
            if info_data.get("date_published"):
                try:
                    date_published = datetime.strptime(info_data["date_published"], "%Y-%m-%d")
                except ValueError:
                    date_published = datetime.now()
            else:
                date_published = datetime.now()
            
            gta6_info = GTA6Information(
                title=info_data.get("title", ""),
                content=info_data.get("content", ""),
                source_name=info_data.get("source_name", ""),
                source_type=source_type,
                date_published=date_published,
                url=info_data.get("url")
            )
            
            # Classify the information
            classified_info = self.validation_system.classify_information(gta6_info)
            
            # Validates against confirmed data
            validation_result = self.validation_system.validate_against_confirmed(classified_info)
            
            return {
                "success": True,
                "validation_result": {
                    "title": classified_info.title,
                    "credibility_level": classified_info.credibility_level.value,
                    "confidence_score": classified_info.confidence_score,
                    "source_reliability": classified_info.source_reliability,
                    "validation_status": validation_result["status"],
                    "conflicts": validation_result.get("conflicts", []),
                    "supporting_evidence": validation_result.get("supporting_evidence", []),
                    "classification_reasons": classified_info.classification_reasons,
                    "formatted_for_article": self.validation_system.format_for_article(classified_info)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Information validation error: {str(e)}"
            }
    
    async def _classify_source(self, source_name: str) -> Dict[str, Any]:
        """
        Classifies the reliability of a source
        """
        try:
            reliability = self.validation_system.get_source_reliability(source_name)
            
            return {
                "success": True,
                "source_classification": {
                    "source_name": source_name,
                    "reliability_score": reliability,
                    "classification": self._get_reliability_classification(reliability),
                    "recommendations": self._get_source_recommendations(reliability)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Source classification error: {str(e)}"
            }
    
    async def _get_confirmed_info(self, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns confirmed information about GTA 6
        """
        try:
            confirmed_info = self.validation_system.confirmed_information
            
            if topic_filter:
                # Filter by topic
                filtered_info = {
                    key: value for key, value in confirmed_info.items()
                    if topic_filter.lower() in key.lower() or topic_filter.lower() in value.lower()
                }
            else:
                filtered_info = confirmed_info
            
            return {
                "success": True,
                "confirmed_information": {
                    "total_items": len(filtered_info),
                    "filter_applied": topic_filter,
                    "information": filtered_info
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error searching confirmed information: {str(e)}"
            }
    
    async def _generate_validation_report(self) -> Dict[str, Any]:
        """
        Generates validation report
        """
        try:
            # Simulate some information for the report
            sample_info = GTA6Information(
                title="GTA 6 Credibility Analysis",
                content="System validation report",
                source_name="Validation System",
                source_type=SourceType.OFICIAL,
                date_published=datetime.now()
            )
            
            classified_sample = self.validation_system.classify_information(sample_info)
            report = self.validation_system.generate_validation_report([classified_sample])
            
            return {
                "success": True,
                "validation_report": {
                    "report_generated": datetime.now().isoformat(),
                    "system_status": "Operacional",
                    "total_sources": len(self.validation_system.source_reliability),
                    "confirmed_facts": len(self.validation_system.confirmed_information),
                    "credibility_levels": {
                        level.value: f"Level {level.value}" for level in CredibilityLevel
                    },
                    "source_types": {
                        source_type.value: f"Type {source_type.value}" for source_type in SourceType
                    },
                    "sample_report": report
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Report generation error: {str(e)}"
            }
    
    def _get_reliability_classification(self, score: float) -> str:
        """
        Classifies reliability based on score
        """
        if score >= 0.9:
            return "VERY_RELIABLE"
        elif score >= 0.7:
            return "RELIABLE"
        elif score >= 0.5:
            return "MODERATELY_RELIABLE"
        elif score >= 0.3:
            return "LESS_RELIABLE"
        else:
            return "UNRELIABLE"
    
    def _get_source_recommendations(self, score: float) -> List[str]:
        """
        Returns recommendations based on credibility score
        """
        if score >= 0.9:
            return [
                "Highly reliable source",
                "Can be used as primary reference",
                "Information can be published with confidence"
            ]
        elif score >= 0.7:
            return [
                "Reliable source",
                "Cross-verification recommended",
                "Suitable for informative articles"
            ]
        elif score >= 0.5:
            return [
                "Moderately reliable source",
                "Verification with multiple sources required",
                "Use with caution in articles"
            ]
        elif score >= 0.3:
            return [
                "Less reliable source",
                "Requires extensive verification",
                "Clearly mark as rumor/speculation"
            ]
        else:
            return [
                "Unreliable source",
                "Not recommended for publication",
                "Use only as starting point for investigation"
            ]
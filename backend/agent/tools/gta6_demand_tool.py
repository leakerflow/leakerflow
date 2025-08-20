#!/usr/bin/env python3
"""
GTA 6 Demand Analysis Tool
Integrates demand analysis and trending system into the agent framework
"""

import json
from typing import Dict, Any, List, Optional
from agentpress.tool import Tool, ToolResult, openapi_schema, usage_example
from agent.gta6_demand_analysis import (
    GTA6DemandAnalyzer,
    ContentType,
    TrendingTopic,
    DemandMetrics,
    ContentOpportunity
)
from datetime import datetime, timedelta

class GTA6DemandTool(Tool):
    """
    Tool for GTA 6 demand analysis and content opportunity identification
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.demand_analyzer = GTA6DemandAnalyzer()
    
    def analyze_demand(self, **kwargs) -> Dict[str, Any]:
        """Analyze GTA 6 demand - compatibility method for validation."""
        return self.analyze_gta6_demand(action="identify_opportunities", **kwargs)
    
    def generate_calendar(self, **kwargs) -> Dict[str, Any]:
        """Generate content calendar - compatibility method for validation."""
        return self.analyze_gta6_demand(action="generate_calendar", **kwargs)
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_gta6_demand",
            "description": "Analyzes GTA 6 demand and identifies content opportunities based on trends and community interest. Essential for content strategy and SEO optimization.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "identify_opportunities", 
                            "generate_calendar", 
                            "get_trending_report",
                            "analyze_keyword",
                            "get_content_suggestions",
                            "analyze_competition"
                        ],
                        "description": "Action to be executed by the demand analyzer"
                    },
                    "keyword": {
                        "type": "string",
                        "description": "Keyword for specific analysis (required for analyze_keyword)"
                    },
                    "content_type": {
                        "type": "string",
                        "enum": [
                            "breaking_news", "deep_analysis", "tutorial_guide", 
                            "theory_speculation", "technical_review", "community_content",
                            "leak_analysis", "comparison"
                        ],
                        "description": "Content type for suggestions (optional for get_content_suggestions)"
                    },
                    "days": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 90,
                        "default": 30,
                        "description": "Number of days for content calendar (for generate_calendar)"
                    },
                    "priority_filter": {
                        "type": "string",
                        "enum": ["HIGH", "MEDIUM", "LOW"],
                        "description": "Priority filter for opportunities (optional)"
                    },
                    "topic_filter": {
                        "type": "string",
                        "enum": [
                            "release_date", "gameplay_mechanics", "map_size", "characters",
                            "vehicles", "weapons", "online_mode", "modding", "system_requirements",
                            "trailer_analysis", "leaks", "rumors"
                        ],
                        "description": "Specific topic filter (optional)"
                    }
                },
                "required": ["action"]
            }
        }
    })
    @usage_example('''
        <!-- Identify high-priority content opportunities -->
        <function_calls>
        <invoke name="analyze_gta6_demand">
        <parameter name="action">identify_opportunities</parameter>
        <parameter name="priority_filter">HIGH</parameter>
        <parameter name="topic_filter">release_date</parameter>
        </invoke>
        </function_calls>
        
        <!-- Generate content calendar for next 30 days -->
        <function_calls>
        <invoke name="analyze_gta6_demand">
        <parameter name="action">generate_calendar</parameter>
        <parameter name="days">30</parameter>
        </invoke>
        </function_calls>
        
        <!-- Analyze specific keyword demand -->
        <function_calls>
        <invoke name="analyze_gta6_demand">
        <parameter name="action">analyze_keyword</parameter>
        <parameter name="keyword">GTA 6 release date</parameter>
        </invoke>
        </function_calls>
        ''')
    async def analyze_gta6_demand(self, action: str, keyword: Optional[str] = None, 
                                 content_type: Optional[str] = None, days: int = 30,
                                 priority_filter: Optional[str] = None, 
                                 topic_filter: Optional[str] = None) -> ToolResult:
        """
        Executes GTA 6 demand analysis
        """
        try:
            action = kwargs.get("action")
            
            if action == "identify_opportunities":
                return await self._identify_opportunities(
                    kwargs.get("priority_filter"),
                    kwargs.get("topic_filter")
                )
            elif action == "generate_calendar":
                return await self._generate_calendar(kwargs.get("days", 30))
            elif action == "get_trending_report":
                return await self._get_trending_report()
            elif action == "analyze_keyword":
                return await self._analyze_keyword(kwargs.get("keyword", ""))
            elif action == "get_content_suggestions":
                return await self._get_content_suggestions(kwargs.get("content_type"))
            elif action == "analyze_competition":
                return await self._analyze_competition(kwargs.get("topic_filter"))
            else:
                return {
                    "success": False,
                    "error": f"Unrecognized action: {action}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Demand analysis error: {str(e)}"
            }
    
    async def _identify_opportunities(self, priority_filter: Optional[str] = None, 
                                    topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Identifies content opportunities
        """
        try:
            opportunities = self.demand_analyzer.identify_content_opportunities()
            
            # Apply filters
            if priority_filter:
                opportunities = [o for o in opportunities if o.priority_level == priority_filter]
            
            if topic_filter:
                topic_enum = TrendingTopic(topic_filter)
                opportunities = [o for o in opportunities if topic_enum in o.trending_topics]
            
            # Convert to serializable format
            opportunities_data = []
            for opp in opportunities:
                opportunities_data.append({
                    "title": opp.title,
                    "content_type": opp.content_type.value,
                    "trending_topics": [topic.value for topic in opp.trending_topics],
                    "demand_score": round(opp.demand_score, 2),
                    "competition_score": round(opp.competition_score, 2),
                    "opportunity_score": round(opp.opportunity_score, 2),
                    "target_keywords": opp.target_keywords,
                    "estimated_traffic": opp.estimated_traffic,
                    "priority_level": opp.priority_level,
                    "creation_urgency": opp.creation_urgency,
                    "target_audience": opp.target_audience
                })
            
            return {
                "success": True,
                "opportunities": {
                    "total_found": len(opportunities_data),
                    "filters_applied": {
                        "priority": priority_filter,
                        "topic": topic_filter
                    },
                    "opportunities": opportunities_data,
                    "summary": {
                        "high_priority": len([o for o in opportunities_data if o["priority_level"] == "HIGH"]),
                        "immediate_urgency": len([o for o in opportunities_data if o["creation_urgency"] == "IMMEDIATE"]),
                        "total_estimated_traffic": sum(o["estimated_traffic"] for o in opportunities_data)
                    }
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Opportunity identification error: {str(e)}"
            }
    
    async def _generate_calendar(self, days: int) -> Dict[str, Any]:
        """
        Generates content calendar
        """
        try:
            calendar = self.demand_analyzer.generate_content_calendar(days)
            
            return {
                "success": True,
                "content_calendar": {
                    "period_days": days,
                    "start_date": datetime.now().strftime("%Y-%m-%d"),
                    "end_date": (datetime.now() + timedelta(days=days-1)).strftime("%Y-%m-%d"),
                    "total_content_pieces": len(calendar),
                    "calendar": calendar,
                    "weekly_breakdown": self._generate_weekly_breakdown(calendar),
                    "content_type_distribution": self._analyze_content_distribution(calendar)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Calendar generation error: {str(e)}"
            }
    
    async def _get_trending_report(self) -> Dict[str, Any]:
        """
        Generates trending report
        """
        try:
            report = self.demand_analyzer.get_trending_report()
            
            # Add additional analysis
            enhanced_report = {
                **report,
                "market_analysis": {
                    "peak_interest_topics": self._get_peak_interest_topics(),
                    "content_gaps": self._identify_content_gaps(),
                    "competitive_landscape": self._analyze_competitive_landscape(),
                    "seasonal_trends": self._analyze_seasonal_trends()
                },
                "recommendations": self._generate_strategic_recommendations(report)
            }
            
            return {
                "success": True,
                "trending_report": enhanced_report
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Trends report generation error: {str(e)}"
            }
    
    async def _analyze_keyword(self, keyword: str) -> Dict[str, Any]:
        """
        Analyzes a specific keyword
        """
        try:
            if not keyword:
                return {
                    "success": False,
                    "error": "Keyword is required for analysis"
                }
            
            # Search for the keyword in existing data
            trending_keywords = self.demand_analyzer.trending_keywords
            
            if keyword in trending_keywords:
                metrics = trending_keywords[keyword]
                
                analysis = {
                    "keyword": keyword,
                    "metrics": {
                        "search_volume": metrics.search_volume,
                        "trend_direction": metrics.trend_direction,
                        "competition_level": metrics.competition_level,
                        "content_gap_score": metrics.content_gap_score,
                        "urgency_score": metrics.urgency_score,
                        "estimated_traffic": metrics.estimated_traffic,
                        "keyword_difficulty": metrics.keyword_difficulty,
                        "last_updated": metrics.last_updated.isoformat()
                    },
                    "opportunity_score": self.demand_analyzer.calculate_opportunity_score(metrics),
                    "content_recommendations": self._generate_keyword_content_recommendations(keyword, metrics),
                    "related_keywords": self._generate_related_keywords_analysis(keyword),
                    "competitive_analysis": self._analyze_keyword_competition(keyword, metrics)
                }
            else:
                # Estimated analysis for uncatalogued keyword
                analysis = {
                    "keyword": keyword,
                    "status": "not_tracked",
                    "estimated_analysis": self._estimate_keyword_potential(keyword),
                    "recommendations": [
                        "Keyword is not being monitored",
                        "Consider adding to tracking system",
                        "Perform manual research to validate potential"
                    ]
                }
            
            return {
                "success": True,
                "keyword_analysis": analysis
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Keyword analysis error: {str(e)}"
            }
    
    async def _get_content_suggestions(self, content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates content suggestions
        """
        try:
            opportunities = self.demand_analyzer.identify_content_opportunities()
            
            if content_type:
                content_type_enum = ContentType(content_type)
                filtered_opportunities = [o for o in opportunities if o.content_type == content_type_enum]
            else:
                filtered_opportunities = opportunities
            
            suggestions = []
            for opp in filtered_opportunities[:10]:  # Limit to 10 suggestions
                suggestion = {
                    "title": opp.title,
                    "content_type": opp.content_type.value,
                    "priority": opp.priority_level,
                    "estimated_traffic": opp.estimated_traffic,
                    "target_keywords": opp.target_keywords[:5],
                    "target_audience": opp.target_audience,
                    "content_outline": self._generate_content_outline(opp),
                    "seo_recommendations": self._generate_seo_recommendations(opp)
                }
                suggestions.append(suggestion)
            
            return {
                "success": True,
                "content_suggestions": {
                    "filter_applied": content_type,
                    "total_suggestions": len(suggestions),
                    "suggestions": suggestions,
                    "content_strategy": self._generate_content_strategy(suggestions)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Suggestions generation error: {str(e)}"
            }
    
    async def _analyze_competition(self, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes competition by topic
        """
        try:
            trending_keywords = self.demand_analyzer.trending_keywords
            
            competition_analysis = []
            for keyword, metrics in trending_keywords.items():
                if not topic_filter or topic_filter.lower() in keyword.lower():
                    analysis = {
                        "keyword": keyword,
                        "competition_level": metrics.competition_level,
                        "keyword_difficulty": metrics.keyword_difficulty,
                        "search_volume": metrics.search_volume,
                        "content_gap_score": metrics.content_gap_score,
                        "competitive_advantage": self._calculate_competitive_advantage(metrics),
                        "market_position": self._determine_market_position(metrics)
                    }
                    competition_analysis.append(analysis)
            
            # Sort by competitive advantage
            competition_analysis.sort(key=lambda x: x["competitive_advantage"], reverse=True)
            
            return {
                "success": True,
                "competition_analysis": {
                    "topic_filter": topic_filter,
                    "total_keywords_analyzed": len(competition_analysis),
                    "analysis": competition_analysis,
                    "market_summary": {
                        "low_competition_opportunities": len([a for a in competition_analysis if a["competition_level"] == "low"]),
                        "high_gap_opportunities": len([a for a in competition_analysis if a["content_gap_score"] > 0.7]),
                        "best_opportunities": competition_analysis[:5]
                    }
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Competition analysis error: {str(e)}"
            }
    
    # Helper methods
    
    def _generate_weekly_breakdown(self, calendar: List[Dict]) -> Dict[str, Any]:
        """Generate weekly breakdown of calendar"""
        weekly_data = {}
        for entry in calendar:
            date = datetime.strptime(entry["date"], "%Y-%m-%d")
            week = f"Week {date.isocalendar()[1]}"
            
            if week not in weekly_data:
                weekly_data[week] = {"count": 0, "content_types": {}}
            
            weekly_data[week]["count"] += 1
            content_type = entry["content_type"]
            weekly_data[week]["content_types"][content_type] = weekly_data[week]["content_types"].get(content_type, 0) + 1
        
        return weekly_data
    
    def _analyze_content_distribution(self, calendar: List[Dict]) -> Dict[str, int]:
        """Analyze content type distribution"""
        distribution = {}
        for entry in calendar:
            content_type = entry["content_type"]
            distribution[content_type] = distribution.get(content_type, 0) + 1
        return distribution
    
    def _get_peak_interest_topics(self) -> List[str]:
        """Identify topics of highest interest"""
        community_interests = self.demand_analyzer.community_interests
        sorted_interests = sorted(community_interests.items(), key=lambda x: x[1], reverse=True)
        return [topic for topic, score in sorted_interests[:5]]
    
    def _identify_content_gaps(self) -> List[str]:
        """Identify content gaps"""
        trending_keywords = self.demand_analyzer.trending_keywords
        gaps = []
        for keyword, metrics in trending_keywords.items():
            if metrics.content_gap_score > 0.7:
                gaps.append(keyword)
        return gaps[:5]
    
    def _analyze_competitive_landscape(self) -> Dict[str, Any]:
        """Analyze competitive landscape"""
        trending_keywords = self.demand_analyzer.trending_keywords
        competition_levels = {"low": 0, "medium": 0, "high": 0}
        
        for metrics in trending_keywords.values():
            competition_levels[metrics.competition_level] += 1
        
        return {
            "total_keywords": len(trending_keywords),
            "competition_distribution": competition_levels,
            "market_saturation": competition_levels["high"] / len(trending_keywords) if trending_keywords else 0
        }
    
    def _analyze_seasonal_trends(self) -> Dict[str, Any]:
        """Analyze seasonal trends"""
        # Seasonal analysis simulation
        current_month = datetime.now().month
        
        seasonal_factors = {
            "current_season": "Q1" if current_month <= 3 else "Q2" if current_month <= 6 else "Q3" if current_month <= 9 else "Q4",
            "peak_months": ["November", "December", "January"],  # Months with highest gaming interest
            "content_focus": "release_speculation" if current_month in [10, 11, 12] else "gameplay_analysis"
        }
        
        return seasonal_factors
    
    def _generate_strategic_recommendations(self, report: Dict) -> List[str]:
        """Generate strategic recommendations"""
        recommendations = []
        
        if report["high_priority_count"] > 3:
            recommendations.append("Focus on high priority content to maximize impact")
        
        if report["immediate_urgency_count"] > 2:
            recommendations.append("There are urgent opportunities requiring immediate action")
        
        if report["total_estimated_traffic"] > 100000:
            recommendations.append("High traffic potential identified - consider increasing production")
        
        recommendations.extend([
            "Monitor trends daily to identify new opportunities",
            "Maintain balance between confirmed and speculative content",
            "Develop relationships with reliable industry sources"
        ])
        
        return recommendations
    
    def _generate_keyword_content_recommendations(self, keyword: str, metrics: DemandMetrics) -> List[str]:
        """Generate content recommendations for keyword"""
        recommendations = []
        
        if metrics.urgency_score > 0.8:
            recommendations.append("Create content immediately - high urgency")
        
        if metrics.content_gap_score > 0.7:
            recommendations.append("Opportunity to fill content gap")
        
        if metrics.competition_level == "low":
            recommendations.append("Low competition - excellent opportunity")
        
        return recommendations
    
    def _generate_related_keywords_analysis(self, keyword: str) -> List[str]:
        """Generate related keywords analysis"""
        # Simulation of related keywords analysis
        base_terms = ["gta 6", "grand theft auto 6", "rockstar games", "vice city"]
        return [f"{keyword} {term}" for term in base_terms[:3]]
    
    def _analyze_keyword_competition(self, keyword: str, metrics: DemandMetrics) -> Dict[str, Any]:
        """Analyze competition for specific keyword"""
        return {
            "difficulty_level": metrics.competition_level,
            "keyword_difficulty_score": metrics.keyword_difficulty,
            "estimated_competitors": int(metrics.keyword_difficulty * 100),
            "content_saturation": 1 - metrics.content_gap_score
        }
    
    def _estimate_keyword_potential(self, keyword: str) -> Dict[str, Any]:
        """Estimate potential of uncatalogued keyword"""
        # Estimation based on patterns
        estimated_volume = 10000 if "gta 6" in keyword.lower() else 5000
        
        return {
            "estimated_search_volume": estimated_volume,
            "estimated_difficulty": 0.5,
            "potential_traffic": estimated_volume * 0.1,
            "recommendation": "Add to monitoring for detailed analysis"
        }
    
    def _generate_content_outline(self, opportunity: ContentOpportunity) -> List[str]:
        """Generate content outline"""
        outlines = {
            ContentType.BREAKING_NEWS: [
                "Introduction with main information",
                "Confirmed details",
                "Community impact",
                "Expected next steps"
            ],
            ContentType.DEEP_ANALYSIS: [
                "Context and background",
                "Detailed analysis",
                "Comparisons and implications",
                "Conclusions and predictions"
            ],
            ContentType.TUTORIAL_GUIDE: [
                "Topic introduction",
                "Detailed step by step",
                "Tips and tricks",
                "Additional resources"
            ]
        }
        
        return outlines.get(opportunity.content_type, [
            "Introduction",
            "Development",
            "Analysis",
            "Conclusion"
        ])
    
    def _generate_seo_recommendations(self, opportunity: ContentOpportunity) -> List[str]:
        """Generate SEO recommendations"""
        return [
            f"Use main keyword: {opportunity.target_keywords[0] if opportunity.target_keywords else 'N/A'}",
            "Include related keywords naturally in text",
            "Optimize meta description with keyword focus",
            "Use structured headings (H1, H2, H3)",
            "Add images with optimized alt text"
        ]
    
    def _generate_content_strategy(self, suggestions: List[Dict]) -> Dict[str, Any]:
        """Generate content strategy"""
        total_traffic = sum(s["estimated_traffic"] for s in suggestions)
        high_priority = len([s for s in suggestions if s["priority"] == "HIGH"])
        
        return {
            "total_estimated_traffic": total_traffic,
            "high_priority_content": high_priority,
            "content_mix_recommendation": "70% analysis, 20% news, 10% speculation",
            "publishing_frequency": "2-3 articles per week",
            "focus_areas": ["release date", "gameplay mechanics", "technical specs"]
        }
    
    def _calculate_competitive_advantage(self, metrics: DemandMetrics) -> float:
        """Calculate competitive advantage"""
        return (metrics.content_gap_score * metrics.urgency_score) / (metrics.keyword_difficulty + 0.1)
    
    def _determine_market_position(self, metrics: DemandMetrics) -> str:
        """Determine market position"""
        advantage = self._calculate_competitive_advantage(metrics)
        
        if advantage > 0.8:
            return "LEADER_OPPORTUNITY"
        elif advantage > 0.6:
            return "STRONG_POSITION"
        elif advantage > 0.4:
            return "COMPETITIVE_POSITION"
        else:
            return "CHALLENGING_MARKET"
#!/usr/bin/env python3
"""
Ferramenta de Análise de Demanda GTA 6
Integra o sistema de análise de demanda e tendências no framework do agente
"""

import json
from typing import Dict, Any, List, Optional
from agentpress.tool import Tool, SchemaType
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
    Ferramenta para análise de demanda e identificação de oportunidades de conteúdo GTA 6
    """
    
    name = "gta6_demand_analysis"
    description = "Analisa demanda e identifica oportunidades de conteúdo sobre GTA 6 baseado em tendências e interesse da comunidade"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.demand_analyzer = GTA6DemandAnalyzer()
    
    @property
    def parameters(self) -> SchemaType:
        return {
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
                    "description": "Ação a ser executada pelo analisador de demanda"
                },
                "keyword": {
                    "type": "string",
                    "description": "Palavra-chave para análise específica (necessário para analyze_keyword)"
                },
                "content_type": {
                    "type": "string",
                    "enum": [
                        "breaking_news", "deep_analysis", "tutorial_guide", 
                        "theory_speculation", "technical_review", "community_content",
                        "leak_analysis", "comparison"
                    ],
                    "description": "Tipo de conteúdo para sugestões (opcional para get_content_suggestions)"
                },
                "days": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 90,
                    "default": 30,
                    "description": "Número de dias para o calendário de conteúdo (para generate_calendar)"
                },
                "priority_filter": {
                    "type": "string",
                    "enum": ["HIGH", "MEDIUM", "LOW"],
                    "description": "Filtro de prioridade para oportunidades (opcional)"
                },
                "topic_filter": {
                    "type": "string",
                    "enum": [
                        "release_date", "gameplay_mechanics", "map_size", "characters",
                        "vehicles", "weapons", "online_mode", "modding", "system_requirements",
                        "trailer_analysis", "leaks", "rumors"
                    ],
                    "description": "Filtro por tópico específico (opcional)"
                }
            },
            "required": ["action"]
        }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executa análise de demanda GTA 6
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
                    "error": f"Ação não reconhecida: {action}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na análise de demanda: {str(e)}"
            }
    
    async def _identify_opportunities(self, priority_filter: Optional[str] = None, 
                                    topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Identifica oportunidades de conteúdo
        """
        try:
            opportunities = self.demand_analyzer.identify_content_opportunities()
            
            # Aplica filtros
            if priority_filter:
                opportunities = [o for o in opportunities if o.priority_level == priority_filter]
            
            if topic_filter:
                topic_enum = TrendingTopic(topic_filter)
                opportunities = [o for o in opportunities if topic_enum in o.trending_topics]
            
            # Converte para formato serializável
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
                "error": f"Erro na identificação de oportunidades: {str(e)}"
            }
    
    async def _generate_calendar(self, days: int) -> Dict[str, Any]:
        """
        Gera calendário de conteúdo
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
                "error": f"Erro na geração do calendário: {str(e)}"
            }
    
    async def _get_trending_report(self) -> Dict[str, Any]:
        """
        Gera relatório de tendências
        """
        try:
            report = self.demand_analyzer.get_trending_report()
            
            # Adiciona análise adicional
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
                "error": f"Erro na geração do relatório de tendências: {str(e)}"
            }
    
    async def _analyze_keyword(self, keyword: str) -> Dict[str, Any]:
        """
        Analisa uma palavra-chave específica
        """
        try:
            if not keyword:
                return {
                    "success": False,
                    "error": "Palavra-chave é obrigatória para análise"
                }
            
            # Busca a palavra-chave nos dados existentes
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
                # Análise estimada para palavra-chave não catalogada
                analysis = {
                    "keyword": keyword,
                    "status": "not_tracked",
                    "estimated_analysis": self._estimate_keyword_potential(keyword),
                    "recommendations": [
                        "Palavra-chave não está sendo monitorada",
                        "Considere adicionar ao sistema de tracking",
                        "Realize pesquisa manual para validar potencial"
                    ]
                }
            
            return {
                "success": True,
                "keyword_analysis": analysis
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na análise da palavra-chave: {str(e)}"
            }
    
    async def _get_content_suggestions(self, content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Gera sugestões de conteúdo
        """
        try:
            opportunities = self.demand_analyzer.identify_content_opportunities()
            
            if content_type:
                content_type_enum = ContentType(content_type)
                filtered_opportunities = [o for o in opportunities if o.content_type == content_type_enum]
            else:
                filtered_opportunities = opportunities
            
            suggestions = []
            for opp in filtered_opportunities[:10]:  # Limita a 10 sugestões
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
                "error": f"Erro na geração de sugestões: {str(e)}"
            }
    
    async def _analyze_competition(self, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Analisa competição por tópico
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
            
            # Ordena por vantagem competitiva
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
                "error": f"Erro na análise de competição: {str(e)}"
            }
    
    # Métodos auxiliares
    
    def _generate_weekly_breakdown(self, calendar: List[Dict]) -> Dict[str, Any]:
        """Gera breakdown semanal do calendário"""
        weekly_data = {}
        for entry in calendar:
            date = datetime.strptime(entry["date"], "%Y-%m-%d")
            week = f"Semana {date.isocalendar()[1]}"
            
            if week not in weekly_data:
                weekly_data[week] = {"count": 0, "content_types": {}}
            
            weekly_data[week]["count"] += 1
            content_type = entry["content_type"]
            weekly_data[week]["content_types"][content_type] = weekly_data[week]["content_types"].get(content_type, 0) + 1
        
        return weekly_data
    
    def _analyze_content_distribution(self, calendar: List[Dict]) -> Dict[str, int]:
        """Analisa distribuição de tipos de conteúdo"""
        distribution = {}
        for entry in calendar:
            content_type = entry["content_type"]
            distribution[content_type] = distribution.get(content_type, 0) + 1
        return distribution
    
    def _get_peak_interest_topics(self) -> List[str]:
        """Identifica tópicos de maior interesse"""
        community_interests = self.demand_analyzer.community_interests
        sorted_interests = sorted(community_interests.items(), key=lambda x: x[1], reverse=True)
        return [topic for topic, score in sorted_interests[:5]]
    
    def _identify_content_gaps(self) -> List[str]:
        """Identifica lacunas de conteúdo"""
        trending_keywords = self.demand_analyzer.trending_keywords
        gaps = []
        for keyword, metrics in trending_keywords.items():
            if metrics.content_gap_score > 0.7:
                gaps.append(keyword)
        return gaps[:5]
    
    def _analyze_competitive_landscape(self) -> Dict[str, Any]:
        """Analisa cenário competitivo"""
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
        """Analisa tendências sazonais"""
        # Simulação de análise sazonal
        current_month = datetime.now().month
        
        seasonal_factors = {
            "current_season": "Q1" if current_month <= 3 else "Q2" if current_month <= 6 else "Q3" if current_month <= 9 else "Q4",
            "peak_months": ["November", "December", "January"],  # Meses de maior interesse em games
            "content_focus": "release_speculation" if current_month in [10, 11, 12] else "gameplay_analysis"
        }
        
        return seasonal_factors
    
    def _generate_strategic_recommendations(self, report: Dict) -> List[str]:
        """Gera recomendações estratégicas"""
        recommendations = []
        
        if report["high_priority_count"] > 3:
            recommendations.append("Foque nos conteúdos de alta prioridade para maximizar impacto")
        
        if report["immediate_urgency_count"] > 2:
            recommendations.append("Há oportunidades urgentes que requerem ação imediata")
        
        if report["total_estimated_traffic"] > 100000:
            recommendations.append("Alto potencial de tráfego identificado - considere aumentar produção")
        
        recommendations.extend([
            "Monitore tendências diariamente para identificar novas oportunidades",
            "Mantenha equilíbrio entre conteúdo confirmado e especulativo",
            "Desenvolva relacionamentos com fontes confiáveis da indústria"
        ])
        
        return recommendations
    
    def _generate_keyword_content_recommendations(self, keyword: str, metrics: DemandMetrics) -> List[str]:
        """Gera recomendações de conteúdo para palavra-chave"""
        recommendations = []
        
        if metrics.urgency_score > 0.8:
            recommendations.append("Criar conteúdo imediatamente - alta urgência")
        
        if metrics.content_gap_score > 0.7:
            recommendations.append("Oportunidade de preencher lacuna de conteúdo")
        
        if metrics.competition_level == "low":
            recommendations.append("Baixa competição - excelente oportunidade")
        
        return recommendations
    
    def _generate_related_keywords_analysis(self, keyword: str) -> List[str]:
        """Gera análise de palavras-chave relacionadas"""
        # Simulação de análise de palavras relacionadas
        base_terms = ["gta 6", "grand theft auto 6", "rockstar games", "vice city"]
        return [f"{keyword} {term}" for term in base_terms[:3]]
    
    def _analyze_keyword_competition(self, keyword: str, metrics: DemandMetrics) -> Dict[str, Any]:
        """Analisa competição para palavra-chave específica"""
        return {
            "difficulty_level": metrics.competition_level,
            "keyword_difficulty_score": metrics.keyword_difficulty,
            "estimated_competitors": int(metrics.keyword_difficulty * 100),
            "content_saturation": 1 - metrics.content_gap_score
        }
    
    def _estimate_keyword_potential(self, keyword: str) -> Dict[str, Any]:
        """Estima potencial de palavra-chave não catalogada"""
        # Estimativa baseada em padrões
        estimated_volume = 10000 if "gta 6" in keyword.lower() else 5000
        
        return {
            "estimated_search_volume": estimated_volume,
            "estimated_difficulty": 0.5,
            "potential_traffic": estimated_volume * 0.1,
            "recommendation": "Adicionar ao monitoramento para análise detalhada"
        }
    
    def _generate_content_outline(self, opportunity: ContentOpportunity) -> List[str]:
        """Gera outline de conteúdo"""
        outlines = {
            ContentType.BREAKING_NEWS: [
                "Introdução com informações principais",
                "Detalhes confirmados",
                "Impacto na comunidade",
                "Próximos passos esperados"
            ],
            ContentType.DEEP_ANALYSIS: [
                "Contexto e background",
                "Análise detalhada",
                "Comparações e implicações",
                "Conclusões e previsões"
            ],
            ContentType.TUTORIAL_GUIDE: [
                "Introdução ao tópico",
                "Passo a passo detalhado",
                "Dicas e truques",
                "Recursos adicionais"
            ]
        }
        
        return outlines.get(opportunity.content_type, [
            "Introdução",
            "Desenvolvimento",
            "Análise",
            "Conclusão"
        ])
    
    def _generate_seo_recommendations(self, opportunity: ContentOpportunity) -> List[str]:
        """Gera recomendações de SEO"""
        return [
            f"Use palavra-chave principal: {opportunity.target_keywords[0] if opportunity.target_keywords else 'N/A'}",
            "Inclua palavras-chave relacionadas naturalmente no texto",
            "Otimize meta description com foco na palavra-chave",
            "Use headings (H1, H2, H3) estruturados",
            "Adicione imagens com alt text otimizado"
        ]
    
    def _generate_content_strategy(self, suggestions: List[Dict]) -> Dict[str, Any]:
        """Gera estratégia de conteúdo"""
        total_traffic = sum(s["estimated_traffic"] for s in suggestions)
        high_priority = len([s for s in suggestions if s["priority"] == "HIGH"])
        
        return {
            "total_estimated_traffic": total_traffic,
            "high_priority_content": high_priority,
            "content_mix_recommendation": "70% análises, 20% notícias, 10% especulação",
            "publishing_frequency": "2-3 artigos por semana",
            "focus_areas": ["release date", "gameplay mechanics", "technical specs"]
        }
    
    def _calculate_competitive_advantage(self, metrics: DemandMetrics) -> float:
        """Calcula vantagem competitiva"""
        return (metrics.content_gap_score * metrics.urgency_score) / (metrics.keyword_difficulty + 0.1)
    
    def _determine_market_position(self, metrics: DemandMetrics) -> str:
        """Determina posição no mercado"""
        advantage = self._calculate_competitive_advantage(metrics)
        
        if advantage > 0.8:
            return "LEADER_OPPORTUNITY"
        elif advantage > 0.6:
            return "STRONG_POSITION"
        elif advantage > 0.4:
            return "COMPETITIVE_POSITION"
        else:
            return "CHALLENGING_MARKET"